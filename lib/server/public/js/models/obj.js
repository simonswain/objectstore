/*global Backbone:true,  _:true, $:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

App.Models.Obj = Backbone.Model.extend({
  defaults: { 
    id: null,
    type: null,
    slug: null,
    attrs: {}
  },
  initialize: function() {
    //_.bindAll(this);
  },
  url : function() {
    var url = '/objects';
    if(!this.isNew()){
      url += '/' + this.get('id');
    }
    return url;
  }

});
