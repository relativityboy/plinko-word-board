Model = {};
(function() {
    var xy = null;
    var fetchPointTimeout = null,
            lock = false,
            pause = false;

    
    var updateTarget = function(e) {
        //console.log(e);
        target.set('now', {x: e.now.x, y: e.now.y});
        /*xy = e.split(',');
         target.set('now',{x:xy[0],y:xy[1]})
         */
    };

    //public function for testing
    setTarget = function(x,y) {
       target.set('now', {x: x, y: y});
    };

    var complete = function() {
        lock = false;
    };

    var fetchPoint = function() {
        clearTimeout(fetchPointTimeout);
        if (!lock && !pause) {
            $.ajax({
                url: 'target.json',
                success: updateTarget,
                complete: complete
            });
            lock = true;
        }
        //fetchPointTimeout = setTimeout(fetchPoint, 50);
    };

    var Target = Backbone.Model.extend({
        defaults: {
            $el: $('ull'),
            now: {
                x: 0,
                y: 0
            },
            screen: {
                x: 0,
                y: 0
            },
            screenoffset: {
                x: 0,
                y: 0
            },
            cameraoffset: {
                x: 0,
                y: 0
            },
            multiplier: {
                x: 1,
                y: 1
            },
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 0,
                y: 0
            }
        },
        initialize: function() {
            this.on('change:now', function() {
                if (this.attributes.now.x > this.attributes.max.x) {
                    this.attributes.max.x = this.attributes.now.x;
                }
                if (this.attributes.now.y > this.attributes.max.y) {
                    this.attributes.max.y = this.attributes.now.y;
                }
                if (this.attributes.now.x < this.attributes.min.x) {
                    this.attributes.min.x = this.attributes.now.x;
                }
                if (this.attributes.now.y < this.attributes.min.y) {
                    this.attributes.min.y = this.attributes.now.y;
                }
            }, this);
            this.on('change:now', this.calculateScreenPoint, this);
            fetchPoint();
            console.log('initializing Target');
            this.screenMaxY = 0;
            this.cameraMinY = 0;
        },
        calculateOffset: function(point) {
            this.attributes.screenoffset = point;
            this.attributes.cameraoffset = this.attributes.now;
        },
        calculateMultiplier: function(screenMax) {
            this.screenMaxY = screenMax.y;
            this.cameraMinY = this.attributes.now.y;
            console.log('calculateMultiplier camoffset, now(max cam), screenoffset, point(max screen)', this.attributes.cameraoffset, this.attributes.now, this.attributes.screenoffset, screenMax);
            this.attributes.multiplier = {
                x: ((screenMax.x - this.attributes.screenoffset.x) / (this.attributes.now.x - this.attributes.cameraoffset.x)),
                y: ((screenMax.y - this.attributes.screenoffset.y) / (this.attributes.cameraoffset.y - this.attributes.now.y))
            };
            console.log('multiplier', this.attributes.multiplier, this.screenMaxY)
            
        },
        calculateScreenPoint: function() {
            this.attributes.screen = {
                x: ((this.attributes.now.x - this.attributes.cameraoffset.x) * this.attributes.multiplier.x),
                y: (this.screenMaxY - ((this.attributes.now.y - this.cameraMinY) * this.attributes.multiplier.y))
            };
            console.log('calculateScreenPoint screen, multi, camMin:', this.attributes.screen, this.attributes.multiplier, this.cameraMinY, this.attributes.now, this.screenMaxY);
            this.trigger('change:screen');
        },
        pauseTracking: function() {
            pause = true;
        },
        resumeTracking: function() {
            pause = false;
        }
        /*
         *
         *  It can take that camera max and create the multiplier
         *  1. Subtract (min) from the camera value.
         *  2. Subtract $ derived screen min from $ derived screen max
         *  3. Take 2./camera.now - that is your multiplier ratio
         *  4. Add back screen min those are your screen coordinates
         */
    });

    var target = new Target();

    Model.Target = function() {
        return target;
    };
})();

Model.Box = Backbone.Model.extend({
    defaults: {
        $el: null,
        screen: {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 0,
                y: 0
            }
        },
        camera: {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 0,
                y: 0
            }
        },
        calibrating: false,
        calibrated: false
    }
});

(function() {
    var newId = 0;
    Model.Cel = Model.Box.extend({
        initialize: function() {
            this.set({id: (newId++)});
            this.attributes.hotzone = {
                screen: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 0,
                        y: 0
                    }
                },
                camera: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 0,
                        y: 0
                    }
                }
            };
            this.attributes.$hz = false;
            this.attributes.$el = false;
            this.attributes.$text = false;
            
            this.on('change:screen change:camera', this.updateHZCoords, this);
        },
        addEl:function($el) {
            this.attributes.$el = $el;
            this.attributes.$hz = $('.w-hotzone', $el[0]);
            this.attributes.$txt = $('.peg-text-display', $el[0]);
            z = this;
        },
        setText:function(txt) {
            this.attributes.$txt.text(txt);
        },
        setTextId:function() {
          this.attributes.$txt.text(this.id);
        },
        updateScreenCoords:function(coords) {
            console.log(coords);
            this.set('screen', { 
                min:{
                    x:coords.x,
                    y:coords.y
                },
                max:{
                    x:coords.x + this.attributes.$el.width(),
                    y:coords.y + this.attributes.$el.height()
                }
            });
        },
        updateHZCoords:function() {
            
        },
        toJSON:function() {
            var o = {};
            o.id = this.attributes.id;
            o.camera = this.attributes.camera;
            o.screen = this.attributes.screen;
            o.camera = this.attributes.camera;
            return o;
        }
    });
})();

Model.Board = Model.Box.extend({
    initialize: function(e) {
        this.$el = e.$el;
        this.attributes.cels = new Collection.Cel();
        this.attributes.screen = {
            min: {
                x: this.$el.offset().left,
                y: this.$el.offset().top
            },
            max: {
                x: this.$el.offset().left + this.$el.width(),
                y: this.$el.offset().top + this.$el.height()
            }
        };
        this.attributes.enableCollisionDetection = false;
        this.on('change:enableCollisionDetection', function() {
            if(this.attributes.enableCollisionDetection) {
                this.attributes.target.on('change:screen', this.detectCollisions, this);
            } else {
                this.attributes.target.off('change:screen', this.detectCollisions);
            }
        }, this);

    },
    calculateOffset: function() {
        console.log('calculateOffset', this.attributes.screen.min)
        this.attributes.target.calculateOffset(this.attributes.screen.min);
        this.calculateMultiplier();
    },
    calculateMultiplier: function() {
        this.attributes.target.calculateMultiplier(this.attributes.screen.max);
    },
    createCell: function() {
        this.attributes.cels.add({
            screen: {
                x: 0,
                y: 0
            },
            camera: {
                x: 0,
                y: 0
            },
        });
    },
    detectCollisions:function() {
        var celBox, 
            cels = this.attributes.cels,
            target = this.attributes.target.attributes.screen;
        for(var i = 0; i < cels.length; i++) {
            celBox = cels.models[i].attributes.screen;
            if(celBox.min.x < target.x && celBox.min.y < target.y && celBox.max.x > target.x && celBox.max.y > target.y) {
                cels.models[i].attributes.$el.addClass('active');
            } else {
                cels.models[i].attributes.$el.removeClass('active');
            }
        }
    },
    showCelNumbers:function() {
        var cels = this.attributes.cels;
        for(var i = 0; i < cels.length; i++) {
            cels.models[i].setTextId()
        }
    },
    toJSON:function() {
        var o = {};
        o.camera = this.attributes.camera;
        o.screen = this.attributes.screen;
        o.cels = this.attributes.cels.toJSON();
        return o;
    }
});