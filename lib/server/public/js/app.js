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

    this.controller = new App.Models.Controller({
      orgs: this.orgs
    });

    this.objs = new App.Collections.Objs([]);

    this.views = {
      app: new App.Views.App({
        controller: this.controller,
        objs: this.objs
      })
    };
  }
};
