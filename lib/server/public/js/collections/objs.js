/*global Backbone:true,  $:true, _:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

App.Collections.Objs = Backbone.Collection.extend({
  model: App.Models.Obj,
  initialize: function(models) {
    _.bindAll(this, 'url', 'update');
    this.filter = new App.Models.ObjsFilter();
    this.listenTo(this.filter, 'change', this.update);
    this.update();
  },
  url: function(){
    var base = '/objects';
    var args = [];

    _.each(this.filter.toJSON(), function(v, k){
      if(!v || v === '' || k === 'count'){
        return;
      }
      args.push(k + '=' + v);
    });
    if(args.length === 0){
      return base;
    }
    return base + '?' + args.join('&');
  },
  update: function(e){
    var self = this;
    $.getJSON(
      this.url(),
      function(res){
        self.filter.set({
          count: res.count
        }, {
          silent: true
        });
        self.reset(res.objects);
      });

  },
  comparator: function(model) {
    return model.get('id');
  }
});

App.Models.ObjsFilter = Backbone.Model.extend({
  defaults:{
    count: 0,
    base: 0,
    limit: 20,
    text: null
  },
  initialize: function(){
    //_.bindAll(this);
  }
});
