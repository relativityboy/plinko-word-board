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
        'click .w-hide-settings': 'evtHide',
        'click .w-toggle-calibration': 'evtToggleCalibration',
        'click .w-tracking-ctrl': 'evtToggleTracking',
        'click .w-set-min': 'evtSetMin',
        'click .w-set-max': 'evtSetMax',
        'click .w-add-cel': 'evtAddCel',
        'click .w-save-cels': 'evtSaveCels',
        'click .w-load-config': 'evtLoadConfiguration',
        'click .w-toggle-collision-detection':'evtToggleCollisionDetection',
        'click .w-calculate-camera-coordinates':'evtCalcCelCameraCoords'
    },
    initialize: function(e) {
        this.$calibrationControls = $('.w-calibration-ctrl', this.el);
        this.$toggleCalibration = $('.w-toggle-calibration', this.el);
        this.$calibrationStatus = $('.w-calibration-status', this.el);
        this.$targetX = $('.w-x', this.el);
        this.$targetY = $('.w-y', this.el);
        this.target = this.model.get('target');
        this.model.get('target').on('change:now', this.renderTargetDisplay, this);
    },
    evtAddCel: function() {
        this.model.createCell();
    },
    evtBoardSize: function() {
        var val = {'width': $('.w-board-width').val(), 'height': $('.w-board-height').val()}
        this.model.set(val);
        
    },
    evtCalcCelCameraCoords:function() {
        this.model.calcServerCoords();
    },
    evtHide: function() {
        this.model.set('mode', 'run');
    },
    evtToggleCalibration: function() {
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
    },
    evtToggleTracking:function() {
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
              for(var i = 0; i < e.cels.length; i++) {
                  z.model.attributes.cels.add(e.cels[i]);
              }
              if(e.hasOwnProperty('resetCel')) {
                  z.model.attributes.resetCel = new Model.Cel(e.resetCel);
              }
              console.log(e, z.model.attributes);
          }
      });
    },
    evtSaveCels: function() {
      $.ajax({
          url:appRoot+'savecels.php',
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
    renderTargetDisplay: function() {
        this.$targetX.html(this.target.attributes.now.x);
        this.$targetY.html(this.target.attributes.now.y);
    }
});

View.CalibrationPoints = Backbone.View.extend({
    initialize: function() {
        this.$min = $('.w-calibration-point-min', this.el);
        this.$max = $('.w-calibration-point-max', this.el);
        this.$target = $('.w-calibration-point-target', this.el);
        this.target = Model.Target();
        this.positionMax();
        this.model.on('change:calibrating', this.evtToggleCalibrationPoints, this);
    },
    positionMax: function() {
        var width = this.$max.width();
        var height = this.$max.height();
        this.$max.css({
            left: (this.$el.width() - width),
            top: (this.$el.height() - height)
        });
    },
    evtToggleCalibrationPoints: function() {
        if (this.model.get('calibrating')) {
            this.$min.animate({opacity: 0.5});
            this.$max.animate({opacity: 0.5});
            this.$target.show();
            this.target.on('change:screen', this.renderTargetPointer, this);
        } else {
            this.$min.animate({opacity: 0.0});
            this.$max.animate({opacity: 0.0});
            this.$target.hide();
            this.target.off('change:screen', this.renderTargetPointer, this);
        }
    },
    renderTargetPointer: function() {
        this.$target.css({left: this.target.attributes.screen.x, top: this.target.attributes.screen.y});
    }
});

View.Cels = Backbone.View.extend({
    initialize: function() {
        this.cels = this.model.get('cels');
        this.cels.on('add', this.evtAddCel, this);
    },
    evtAddCel: function() {
        var cel = this.cels.last()
            z = this;
        this.$el.snippetAppend('peg', cel);
        cel.addEl($('#cel__' + cel.id));
        cel.attributes.$el.draggable();
        cel.attributes.$el.on( "dragstop",
        function( e, ui ) {
            cel.updateScreenCoords({
                x:ui.position.left,
                y:ui.position.top
            });
        } );
    },
});

View.Page = Backbone.View.extend({
    events: {
        'click .w-mode-setup': 'evtModeSetup'
    },
    initialize: function() {
        $board = this.model.$el;
        this.views = {};
        this.views.controlPanel = new View.ControlPanel({el: $('.w-controlpanel')[0], model: this.model});
        this.views.calibrationPoints = new View.CalibrationPoints({el: $board[0], model: this.model});
        this.views.cels = new View.Cels({el: $board[0], model: this.model});
        this.model.on('change:mode', this.evtChangeMode, this);
        this.model.on('change:width change:height', this.evtBoardSize, this);
    },
    evtBoardSize:function() {
        console.log('fadf');
        console.log(this)
        this.model.$el.css({width:this.model.get('width'), height:this.model.get('height')});
    },
    evtChangeMode:function() {
      if(this.model.get('mode') === 'setup') {
        this.$el.addClass('setup');  
      } else {
        this.$el.removeClass('setup');  
      }
    },
    evtModeSetup: function() {
        this.model.set('mode', 'setup');
    }
});