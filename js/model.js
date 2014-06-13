Model = {};

Model.Wordbanks = Backbone.Model.extend({
    defaults: {
        banks: {}
    },
    initialize: function() {

    },
    loadWordbanks: function() {
        var z = this;
        console.log('load wordbanks')
        $.ajax({
            url: appRoot + 'wordbanks.json',
            dataType:'text',
            success: function(e) {
                var banks = $.extend({}, z.attributes.banks, e);
                z.set('banks', banks);
            },
            dataFilter:function(e) {
                return JSON.parse(e);
            },
            error:function(e) {
                console.log('error loading wordbanks', arguments);
            }
        });
    }
});
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
    setTarget = function(x, y) {
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
        fetchPointTimeout = setTimeout(fetchPoint, 200);
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
            },
            calculationMode: 'normal'
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
            this.on('change:now', this.updateScreenPoint, this);
            fetchPoint();
            this.screenMaxY = 0;
            this.cameraMinY = 0;
        },
        calculateOffset: function(point) {
            console.log('calculateOffset screen, camera', point, this.attributes.now);
            this.attributes.screenoffset = point;
            this.attributes.cameraoffset = this.attributes.now;
        },
        calculateMultiplier: function(screenMax) {
            console.log('calculateMultiplier screenMax, camera', screenMax, this.attributes.now);
            this.screenMaxY = screenMax.y;
            this.cameraMinY = this.attributes.now.y;
            this.attributes.multiplier = {
                x: ((screenMax.x - this.attributes.screenoffset.x) / (this.attributes.now.x - this.attributes.cameraoffset.x)),
                y: ((screenMax.y - this.attributes.screenoffset.y) / (this.attributes.cameraoffset.y - this.attributes.now.y))
            };
            console.log('calculateMultiplier multipier', this.attributes.multiplier);
        },
        calculateScreenPoint: function(cameraPoint) {
            return {
                x: ((cameraPoint.x - this.attributes.cameraoffset.x) * this.attributes.multiplier.x),
                y: (this.screenMaxY - ((cameraPoint.y - this.cameraMinY) * this.attributes.multiplier.y))
            };

        },
        calculateCameraPoint: function(screenPoint) {
            var attrs = this.attributes;
            var resp = {
                x: ((screenPoint.x / this.attributes.multiplier.x) + this.attributes.cameraoffset.x),
                y: (
                        this.attributes.cameraoffset.y -
                        ((screenPoint.y - this.attributes.screenoffset.y) /
                                this.attributes.multiplier.y))
            };
            return resp;
        },
        tracking: function(active) {
            if (typeof active == 'boolean') {
                pause = (active) ? false : true;
            }
            this.set('tracking', !pause);
            return !pause;
        },
        updateCameraPoint: function() {
            this.attributes.camera = this.calculateCameraPoint(this.attributes.now);
            this.trigger('change:camera');
        },
        updateScreenPoint: function() {
            this.attributes.screen = this.calculateScreenPoint(this.attributes.now);
            this.trigger('change:screen');
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
            if (!this.id) {
                newId++;
                this.set({id: newId});
            } else {
                if (!isNaN(parseInt(newId))) {
                    newId = parseInt(this.id) + 1;
                }
            }
            if (!this.attributes.hasOwnProperty('hotzone')) {
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
            }
            this.attributes.$hz = false;
            this.attributes.$el = false;
            this.attributes.$text = false;

            this.on('change:screen change:camera', this.updateHZCoords, this);
        },
        addEl: function($el) {
            this.attributes.$el = $el;
            this.attributes.$hz = $('.w-hotzone', $el[0]);
            this.attributes.$txt = $('.w-text-display', $el[0]);
            z = this;
        },
        setText: function(txt) {
            this.attributes.$txt.text(txt);
        },
        setTextId: function() {
            this.attributes.$txt.text(this.id);
        },
        detectScreenCollision: function(coords) {
            var celBox = this.attributes.hotzone.screen;
            return celBox.min.x < coords.x && celBox.min.y < coords.y && celBox.max.x > coords.x && celBox.max.y > coords.y;

        },
        updateScreenCoords: function(coords) {
            var hzPos = this.attributes.$hz.position();
            this.attributes.screen = {
                min: {
                    x: coords.x,
                    y: coords.y
                },
                max: {
                    x: coords.x + this.attributes.$el.width(),
                    y: coords.y + this.attributes.$el.height()
                }
            };

            this.attributes.hotzone.screen = {
                min: {
                    x: coords.x + hzPos.left,
                    y: coords.y + hzPos.top
                },
                max: {
                    x: coords.x + hzPos.left + this.attributes.$hz.width(),
                    y: coords.y + hzPos.top + this.attributes.$hz.height()
                }
            };

        },
        updateCameraCoordsByScreenCoords: function() {
            this.attributes.camera.min = Model.Target().calculateCameraPoint(this.attributes.screen.min);
            this.attributes.camera.max = Model.Target().calculateCameraPoint(this.attributes.screen.max);
            this.attributes.hotzone.camera.min = Model.Target().calculateCameraPoint(this.attributes.hotzone.screen.min);
            this.attributes.hotzone.camera.max = Model.Target().calculateCameraPoint(this.attributes.hotzone.screen.max);
            this.trigger('change:camera');
        },
        updateHZCoords: function() {

        },
        toJSON: function() {
            var o = {};
            o.id = this.attributes.id;
            o.camera = this.attributes.camera;
            o.screen = this.attributes.screen;
            o.hotzone = this.attributes.hotzone;
            return o;
        }
    });
})();

Model.Board = Model.Box.extend({
    initialize: function(e) {
        this.$el = e.$el;
        this.attributes.width = e.$el.width();
        this.attributes.height = e.$el.height();
        this.attributes.cels = new Collection.Cel();
        this.attributes.resetCel = new Model.Cel({id: 'reset'});
        this.attributes.resetCel.addEl($('.w-word-banner', this.$el[0]));
        this.attributes.wordbanks = new Model.Wordbanks();
        
        this.attributes.screen = {
            /*
             * we were originally going for using the full browser window as our coordinate system.
             * we bailed on that.
             * min: {
                x: this.$el.offset().left,
                y: this.$el.offset().top
            },
             max: {
                x: this.$el.offset().left + this.$el.width(),
                y: this.$el.offset().top + this.$el.height()
            }*/
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: this.$el.width(),
                y: this.$el.height()
            }
        };
        this.attributes.enableCollisionDetection = false;
        this.on('change:enableCollisionDetection', function() {
            if (this.attributes.enableCollisionDetection) {
                this.attributes.target.on('change:screen', this.detectCollisions, this);
            } else {
                this.attributes.target.off('change:screen', this.detectCollisions);
            }
        }, this);
        this.on('change:mode', this.evtModeChange, this);

    },
    calculateOffset: function() {
        console.log('Board.calculateOffset -> screen.min:', this.attributes.screen.min)
        this.attributes.target.calculateOffset(this.attributes.screen.min);
        this.calculateMultiplier();
    },
    calculateMultiplier: function() {
        //this.attributes.target.calculateMultiplier(this.attributes.screen.max);
        this.attributes.target.calculateMultiplier({x:this.attributes.width, y:this.attributes.height});
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
    calcServerCoords: function() {
        this.attributes.resetCel.updateCameraCoordsByScreenCoords();
        for (var i = 0; i < this.attributes.cels.length; i++) {
            console.log(this.attributes.cels.models)
            this.attributes.cels.models[i].updateCameraCoordsByScreenCoords();
        }
        ;
    },
    detectCollisions: function() {
        console.log(':::::::::::detectCollisions running:');
        var celBox,
                cels = this.attributes.cels,
                target = this.attributes.target.attributes.screen;
        if (this.attributes.mode == 'setup') {
            console.log('detectCollisions resetCel', this.attributes.resetCel);
            if (this.attributes.resetCel.detectScreenCollision(target)) {
                this.attributes.resetCel.attributes.$el.addClass('active');
                console.log(this.attributes.resetCel.attributes.$el[0]);
                return;
            }
            this.attributes.resetCel.attributes.$el.removeClass('active');
            for (var i = 0; i < cels.length; i++) {
                if (cels.models[i].detectScreenCollision(target)) {
                    cels.models[i].attributes.$el.addClass('active');
                } else {
                    cels.models[i].attributes.$el.removeClass('active');
                }
            }
        } else {
            if (this.attributes.resetCel.detectScreenCollision(target)) {
                this.resetWords();
                return;
            }
            for (var i = 0; i < cels.length; i++) {
                if (cels.models[i].detectScreenCollision(target)) {
                    cels.models[i].setText(this.attributes.wordbanks.attributes.banks.main['peg' + cels.models[i].id][0]);
                }
            }
        }
    },
    evtModeChange: function() {
        if (this.get('mode') == 'run' || this.get('mode') == 'test-run') {
            this.set('enableCollisionDetection', true);
        }

    },
    loadConfiguration: function(e) {
        if (e.height) {
            this.set('height', e.height);
            this.set('width', e.width);
        }
        for (var i = 0; i < e.cels.length; i++) {
            this.attributes.cels.add(e.cels[i]);
        }
        /*if (e.hasOwnProperty('resetCel')) {
         this.attributes.resetCel = new Model.Cel(e.resetCel);
         this.attributes.resetCel.addEl($('.w-word-banner', this.$el[0]));
         }*/
    },
    resetWords: function() {
        var cels = this.attributes.cels;
        for (var i = 0; i < cels.length; i++) {
            cels.models[i].setText('');
        }
        this.attributes.resetCel.setText('');
    },
    showCelNumbers: function() {
        var cels = this.attributes.cels;
        for (var i = 0; i < cels.length; i++) {
            cels.models[i].setTextId()
        }
    },
    tracking: function(active) {
        return this.attributes.target.tracking(active);
    },
    toJSON: function() {
        var o = {};
        o.resetCel = this.attributes.resetCel.toJSON();
        o.width = this.attributes.width;
        o.height = this.attributes.height;
        o.camera = this.attributes.camera;
        o.screen = this.attributes.screen;
        o.cels = this.attributes.cels.toJSON();
        return o;
    },
    updateScreenMaxMin:function() {
        this.attributes.screen = {
            /*
             * we were originally going for using the full browser window as our coordinate system.
             * we bailed on that.
             * min: {
                x: this.$el.offset().left,
                y: this.$el.offset().top
            },
             max: {
                x: this.$el.offset().left + this.$el.width(),
                y: this.$el.offset().top + this.$el.height()
            }*/
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: this.$el.width(),
                y: this.$el.height()
            }
        };
    }
});