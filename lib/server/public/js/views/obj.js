/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Obj = Backbone.View.extend({
  template: _.template('<div class="actions"></div>\
 <div class="editor"></div>'),
  initialize : function(opts) {
    var self = this;
    _.bindAll(this, 'render');
    this.objs = opts.objs;

    this.obj = new App.Models.Obj({id: opts.obj_id});
    this.obj.fetch();

    this.render();
  },
  render: function() {

    _.each(this.views, function(x){
      x.close();
    });

    this.views = {};

    this.$el.html(this.template());

    this.views.actions = new App.Views.ObjActions({
      objs: this.objs,
      el: this.$('.actions')
    });

    this.views.form = new App.Views.ObjForm({
      obj: this.obj,
      objs: this.objs,
      el: this.$('.editor')
    });

  }
});

App.Views.ObjActions = Backbone.View.extend({
  template: _.template('<a href="/" class="back">Back</a>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.render();
  },
  render: function() {
    $(this.el).html(this.template());
  }
});


App.Views.ObjForm = Backbone.View.extend({
  template: _.template('\
<div class="form">\
<form>\
<table>\
<tr><td>ID</td><td><input type="text" name="id" value="<%= id %>" /></td></tr>\
<tr><td>Type</td><td><input type="text" name="type" value="<%= type %>" /></td></tr>\
<tr><td>Slug</td><td><input type="text" name="slug" value="<%= slug %>" /></td></tr>\
<tr><td>Attrs</td><td><pre><%= JSON.stringify(attrs, null, 2) %></pre></td></tr>\
</table>\
</div>\
</form>\
</div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render', 'onChange');

    this.obj = opts.obj;
    this.listenTo(this.obj, 'reset change', this.render);

  },
  events: {
    'change input': 'onChange',
  },
  onChange: function(e){
    var self = this;
    e.preventDefault();
    var t = $(e.target);
    var val = t.val();
    var key = t.attr('name');
    var opts = {};
    opts[key] = val;
    console.log(opts);
    //this.obj.set(opts);    
    // console.log('SAVING..', this.obj.toJSON());
    // this.obj.save({
    //   success: function(){
    //     console.log('SAVED OK');
    //   },
    //   error: function(){
    //     console.log('SAVEDFAIL');
    //   }
    // });
  },
  render: function() {
    var data = this.obj.toJSON();
    console.log(data);
    $(this.el).html(this.template(data));
  }
});
