/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.App = Backbone.View.extend({
  el: '#app',
  template: _.template('<header class="nav"></header>\
<div class="view"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.objs = opts.objs;
    this.controller = opts.controller;
    
    this.listenTo(this.controller, 'change:view', this.render);

    this.render();
  },
  render : function() {

    _.each(this.views, function(x){
      x.close();
    });

    this.views = {};

    $(this.el).html(this.template());

    this.views.nav = new App.Views.Nav({
      el: this.$('.nav'),
    });

    var view = this.controller.get('view');

    var el = this.$('.view');
    el.addClass(view);

    switch (view){

    case 'objs':
      this.views.main = new App.Views.Objs({
        el: el,
        objs: this.objs
      });
      break;
      
    case 'obj':
      this.views.main = new App.Views.Obj({
        el: el,
        objs: this.objs,
        obj_id: this.controller.get('obj_id')
      });
      break;
    }

  }
});
