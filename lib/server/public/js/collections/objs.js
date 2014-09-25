/*global Backbone:true,  _:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

App.Collections.Objs = Backbone.Collection.extend({
  model: App.Models.Obj,
  initialize: function(models) {
    //_.bindAll(this, '');
    this.fetch({reset: true});
  },
  comparator: function(model) {
    return model.get('id');
  },
  url: '/objects'
});
