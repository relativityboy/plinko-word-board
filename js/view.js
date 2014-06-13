View = {};
/*
 View.Settings = Backbone.View.extend({
 initialize: function() {
 this.views = {};
 this.views.controlPanel = new View.SettingsControlPanel({el: $('.w-settings-controls')[0]});
 }
 });*/

View.ControlPanel = Backbone.View.extend({
    events: {
        'change .w-board-width': 'evtBoardSize',
        'change .w-board-height': 'evtBoardSize',
        'click .w-mode-switch': 'evtSetMode',
        //'click .w-toggle-calibration': 'evtToggleCalibration',
        'click .w-tracking-ctrl': 'evtToggleTracking',
        'click .w-set-min': 'evtSetMin',
        'click .w-set-max': 'evtSetMax',
        'click .w-add-cel': 'evtAddCel',
        'click .w-save-config': 'evtSaveConfiguration',
        'click .w-load-config': 'evtLoadConfiguration',
        'click .w-toggle-collision-detection':'evtToggleCollisionDetection',
        'click .w-calculate-camera-coordinates':'evtCalcCelCameraCoords',
        'click .w-load-wordbanks':'evtLoadWordbanks'
    },
    initialize: function(e) {
        this.$el.draggable();
        this.$calibrationControls = $('.w-calibration-ctrl', this.el);
        this.$toggleTracking = $('.w-tracking-ctrl', this.el);
        this.$calibrationStatus = $('.w-calibration-status', this.el);
        this.$targetX = $('.w-x', this.el);
        this.$targetY = $('.w-y', this.el);
        this.$boardWidth = $('.w-board-width', this.el);
        this.$boardHeight = $('.w-board-height', this.el);
        this.target = this.model.get('target');
        
        this.views = {};
        this.views.test = new View.Testing({el:$('.w-testing', this.el), model:this.model});
        
        this.model.get('target').on('change:now', this.renderTargetDisplay, this);
        this.model.on('change:width change:height', function() {
            this.$boardWidth.val(this.model.get('width'));
            this.$boardHeight.val(this.model.get('height'));
        }, this);
        this.model.on('change:enableCollisionDetection', this.renderCollisionDetectionButton, this);
        this.target.on('change:tracking', this.evtRenderToggleTrackingButton, this);
        
    },
    evtAddCel: function() {
        this.model.createCell();
    },
    evtBoardSize: function() {
        var val = {width: this.$boardWidth.val(), height: this.$boardHeight.val()}
        this.model.set(val);

    },
    evtCalcCelCameraCoords:function() {
        this.model.calcServerCoords();
    },
    evtSetMode: function(e) {
        console.log(e)
        this.model.set('mode', $(e.currentTarget).data('val'));
    },
    /*evtToggleCalibration: function() {
        if (!this.model.get('calibrating')) {
            this.model.set('calibrating', true);
            this.$toggleCalibration.val('disable calibration');
            this.$calibrationStatus.css({opacity: 1});
            this.$calibrationControls.removeAttr('disabled');
            this.model.showCelNumbers();

            $('body').addClass('setup');
        } else {
            this.model.set('calibrating', false);
            this.$toggleCalibration.val('enable calibration');
            this.$calibrationStatus.css({opacity: 0});
            this.$calibrationControls.attr('disabled', 'disabled');
            $('body').removeClass('setup');
        }
    },*/
    evtLoadWordbanks:function() {
        this.model.attributes.wordbanks.loadWordbanks();
    },
    evtToggleTracking:function(tracking) {
        var tracking = (typeof tracking == 'boolean')? tracking : this.model.tracking();
        if(tracking) {
            this.model.tracking(false);
        } else {
            this.model.tracking(true);
        }
    },
    evtRenderToggleTrackingButton:function() {
        var tracking = this.model.tracking();
        if(tracking) {
            this.$toggleTracking.val('disable tracking');
        } else {
            this.$toggleTracking.val('enable tracking');
        }
    },
    evtToggleCollisionDetection: function() {
        var enableCollisionDetection = (this.model.get('enableCollisionDetection'))? false : true;
        this.model.set('enableCollisionDetection', enableCollisionDetection);

        if(enableCollisionDetection) {
            $('.w-toggle-collision-detection').val('Disable Coll Detection');
        } else {
            $('.w-toggle-collision-detection').val('Enable Coll Detection');
        }

    },
    evtSetMin: function() {
        this.model.calculateOffset();

    },
    evtLoadConfiguration: function() {
       var z = this;
       $.ajax({
          url: appRoot+'configuration.json',
          type:'get',
          success:function(e) {
              z.model.loadConfiguration(e);
          }
      });
    },
    evtSaveConfiguration: function() {
      $.ajax({
          url:appRoot+'saveconfiguration.php',
          type:'POST',
          data:{
              celJSON:this.model.toJSON()
          }
      });
    },
    evtSetMax: function() {
        this.model.calculateMultiplier();
    },
    show: function() {
        this.$el.show();
    },
    renderCollisionDetectionButton:function() {
        if(this.model.get('enableCollisionDetection')) {
            $('.w-toggle-collision-detection').val('Disable Coll Detection');
        } else {
            $('.w-toggle-collision-detection').val('Enable Coll Detection');
        }
    },
    renderTargetDisplay: function() {
        this.$targetX.html(this.target.attributes.now.x);
        this.$targetY.html(this.target.attributes.now.y);
    }
});

View.Testing = Backbone.View.extend({
   events: {
       'click .w-test-calibration':'evtRunCalibrationProfile',
       'change .w-test-cam-y':'evtSetCamCoords',
       'change .w-test-cam-x':'evtSetCamCoords'
   }, 
   initialize:function(e) {
       this.$camY = $('.w-test-cam-y', this.el);
       this.$camX = $('.w-test-cam-x', this.el);
       this.calibrations = {
           '1':function() {
               setTarget(200,400); board.calculateOffset(); setTarget(400, 0); board.calculateMultiplier(); setTarget(200, 200)
           },
           '2':function() {
               setTarget(0,400); board.calculateOffset(); setTarget(400, 0); board.calculateMultiplier(); setTarget(200, 200)
           }
       }
   },
   evtRunCalibrationProfile:function(e) {
       var id = $(e.currentTarget).data('value');
        console.log('running test calibration profile ', id);
        console.log(this.calibrations[id])
        this.calibrations[id]();
        console.log('done');
   },
   evtSetCamCoords:function() {
       setTarget(this.$camX.val(), this.$camY.val());
   }
});

View.CalibrationPoints = Backbone.View.extend({
    initialize: function() {
        this.$min = $('.w-calibration-point-min', this.el);
        this.$max = $('.w-calibration-point-max', this.el);
        this.$targetSprite = $('.w-calibration-point-target', this.el);
        
        this.target = Model.Target();
        this.positionMax();
        this.model.on('change:mode', this.evtToggleCalibrationPoints, this);
        this.model.on('change:width change:height', this.positionMax, this);
        
    },
    positionMax: function() {
        var width = this.$max.width();
        var height = this.$max.height();
		  console.log(width, height, this.$el[0]);
		  console.log(this.$el.width(), this.$el.height());
		  var css = {
            left: (this.model.get('width') - width),
            top: (this.model.get('height') - height)
        }
		  console.log(css);
        this.$max.css(css);
    },
    evtToggleCalibrationPoints: function() {
        switch(this.model.get('mode')) {
            case 'setup' :
            case 'test' :
                this.$min.animate({opacity: 0.5});
                this.$max.animate({opacity: 0.5});
                this.$targetSprite.show();
                this.targetSpriteOffsetX = this.$targetSprite.width() * 0.5;
                this.targetSpriteOffsetY = this.$targetSprite.height() * 0.5;
                this.target.on('change:screen', this.renderTargetPointer, this);
                break;
            default :
                this.$min.animate({opacity: 0.0});
                this.$max.animate({opacity: 0.0});
                this.$targetSprite.hide();
                this.target.off('change:screen', this.renderTargetPointer, this);
        }
    },
    renderTargetPointer: function() {
        this.$targetSprite.css({left: this.target.attributes.screen.x - this.targetSpriteOffsetX, top: this.target.attributes.screen.y - this.targetSpriteOffsetY});
    }
});


View.Cels = Backbone.View.extend({
    initialize: function() {
        this.cels = this.model.get('cels');
        this.cels.on('add', this.evtAddCel, this);
    },
    evtAddCel: function(cel) {
        var z = this;
        this.$el.snippetAppend('peg', cel);
        cel.addEl($('#cel__' + cel.id));
        cel.attributes.$el.draggable();
        cel.attributes.$el.on( "dragstop",
            function( e, ui ) {
                cel.updateScreenCoords({
                    x:ui.position.left,
                    y:ui.position.top
                });
                z.cels.sort();
            });
        cel.on('change:text', this.renderCelText, this);
    },
    renderCelText:function(cel, i) {
        console.log(cel.attributes.$txt.text());
        if(cel.attributes.text != '') {
           cel.attributes.$txt.fadeIn(500); 
        } else {
           cel.attributes.$txt.hide();  
        }
        if(this.model.attributes.mode == 'run' || this.model.attributes.mode =='test') {
            console.log(this.model.attributes.resetCel.attributes.$txt.append('<span>' + cel.attributes.text + '</span>'));
            $('span', this.model.attributes.resetCel.attributes.$txt[0]).animate({opacity:1});
        }
        
    }
});

View.Board = Backbone.View.extend({
   initialize:function(e) {
       var z = this;
       var now;
       this.$banner = $('.word-banner', this.el);
       this.$display = $('.w-text-display', this.$banner[0]);
       this.model.on('change:width change:height', this.evtRepositionBanner,this);
       this.target = this.model.get('target');
       this.$el.on('keypress', function(ev) {
           switch(ev.which) {
               case 119 :
                   z.target.attributes.now.y = z.target.attributes.now.y + 1;
                   z.target.trigger('change:now');
                   break;
               case 115 :
                   z.target.attributes.now.y = z.target.attributes.now.y - 1;
                   z.target.trigger('change:now');
                   break;
               case 100 :
                   z.target.attributes.now.x = z.target.attributes.now.x + 1;
                   z.target.trigger('change:now');
                   break;
               case 97 :
                   z.target.attributes.now.x = z.target.attributes.now.x - 1;
                   z.target.trigger('change:now');
                   break;
           }
       });
   },
   evtRepositionBanner:function() {
       var css = {
           height:this.model.get('height'),
           width:40,
           left:this.model.get('width') - 40
       }
       
       this.$banner.css(css);

       css = {
           width:this.$banner.height(),
           height:this.$banner.width()
       }
       this.$display.css(css);

       css = {
           left:(this.$display.height() * 0.5) - (this.$display.width() * 0.5),
           top:(this.$display.width() * 0.5) - (this.$display.height() * 0.5)
       }
       this.$display.css(css);

       var coords = {
           x:this.$banner.position().left,
           y:this.$banner.position().top
       }
       this.model.attributes.resetCel.updateScreenCoords(coords);
   }
});

View.Page = Backbone.View.extend({
    events: {
        'click .w-mode-setup': 'evtModeSetup'
    },
    initialize: function() {
        $board = this.model.$el;
        this.views = {};
        //We have different views rooted in the same model because they serve different functions, much like a layer cake.
        this.views.controlPanel = new View.ControlPanel({el: $('.w-controlpanel')[0], model: this.model});
        this.views.calibrationPoints = new View.CalibrationPoints({el: $board[0], model: this.model});
        this.views.cels = new View.Cels({el: $board[0], model: this.model});
        this.views.board = new View.Board({el: $board[0], model: this.model});
        this.model.on('change:mode', this.evtChangeMode, this);
        this.model.on('change:width change:height', this.evtBoardSize, this);
    },
    evtBoardSize:function() {
        this.model.$el.css({width:this.model.get('width'), height:this.model.get('height')});
    },
    evtChangeMode:function() {
        console.log('changeMode ', this.model.get('mode'))
      this.$el.removeClass('setup').removeClass('test').removeClass('run');
      this.$el.addClass(this.model.get('mode'));
    },
    evtModeSetup: function() {
        this.model.set('mode', 'setup');
    }
});