/*global Backbone:true,  _:true, $:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

$(function(){
  App.start();
});

Backbone.View.prototype.close = function(){
  this.stopListening();
  if (this.onClose){
    this.onClose();
  }
  this.remove();
};

var App = {
  Models: {},
  Collections: {},
  Views: {},
  start: function(){

    this.controller = new App.Models.Controller({});

    this.objs = new App.Collections.Objs([]);

    this.router = new App.Router();

    this.views = {
      app: new App.Views.App({
        controller: this.controller,
        objs: this.objs
      })
    };

    Backbone.history.start({pushState: true});

  }
};

App.Router = Backbone.Router.extend ({
  routes: {
    "": "objs",
    "objects/:id": "obj",
    "*default": "objs"
  },

  objs: function() {
    App.controller.set({
      view: 'objs'
    });
  },

  obj: function(id) {
    App.controller.set({
      view: 'obj',
      obj_id: id
    });
  }

});
