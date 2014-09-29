/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Objs = Backbone.View.extend({
  template: _.template('<!--<div class="actions"></div>-->\
 <div class="selector"></div>\
 <div class="dataset"></div>'),
  initialize : function(opts) {
    var self = this;
    _.bindAll(this, 'render');
    this.objs = opts.objs;
    this.render();
  },
  render: function() {

    _.each(this.views, function(x){
      x.close();
    });

    if(!this.objs){
      this.$el.html('');
      return;
    }

    this.views = {};

    this.$el.html(this.template());

    // this.views.actions = new App.Views.ObjsActions({
    //   objs: this.objs,
    //   el: this.$('.actions')
    // });

    // this.views.selector = new App.Views.ObjsSelector({
    //   objs: this.objs,
    //   el: this.$('.selector')
    // });

    this.views.dataset = new App.Views.ObjsDataset({
      objs: this.objs,
      el: this.$('.dataset')
    });

  }
});

App.Views.ObjsActions = Backbone.View.extend({
  template: _.template('<ul>\
<li><a href="/objects/new" class="create">+</a></li>\
</ul>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.objs = opts.objs;
    this.views = {};
    this.render();
  },
  render: function() {

    _.each(this.views, function(x){
      x.close();
    });

    this.views = {};

    $(this.el).html(this.template());

  }
});


App.Views.ObjsSelector = Backbone.View.extend({
  template: _.template('<div class="pager"></div>\
<div class="filter"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');

    this.views = {};

    this.objs = opts.objs;
    this.render();
  },
  render: function() {

    _.each(this.views, function(x){
      x.close();
    });

    this.views = {};

    $(this.el).html(this.template());

  }
});

App.Views.ObjsDataset = Backbone.View.extend({
  template: _.template('<div class="holder">\
<div class="sizer-top"></div>\
<div class="sizer-mid">\
<table>\
<thead>\
<td>ID</td>\
<td>Type</td>\
<td>Slug</td>\
</thead>\
<tbody></tbody>\
</table>\
</div>\
<div class="sizer-end"></div>\
</div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render', 'add', 'renderAll', 'onScroll');

    this.objs = opts.objs;

    $(this.el).on('scroll', this.onScroll);
    if(this.objs){
      this.render();
    } else {
      this.listenToOnce(this.objs, 'reset', this.render);
    }

  },
  onScroll: function(){
    this.scrollY = 0 - $('.sizer-top').position().top;
    this.sizerTop.css({height: this.scrollY});
    var base = Math.floor(this.scrollY / this.row_h);
    if(base < 0){
      base = 0;
    }
    this.objs.filter.set({
      base: base
    });
  },
  render: function() {

    this.scrollY = 0;

    this.h = this.$el.height(); // .dataset

    // temporary els to determine sizes from css
    $(this.el).html(this.template());

    var view = new App.Views.ObjsRow({
      el: $('<tr />').appendTo(this.$('tbody:first')),
      obj: new App.Models.Obj({
        id: '&nbsp;'
      })
    });

    this.row_h = this.$('tr:first').height() + 2; // +2 for css borders
    view.remove();

    this.limit = Math.floor(this.h / this.row_h);
    this.views = [];

    this.$el.html(this.template());

    this.sizerTop = this.$('.sizer-top');
    // enforce height of table so it doesn't jiggle when rendering
    this.sizerMid = this.$('.sizer-mid'); 
    this.sizerEnd = this.$('.sizer-end');
    this.tbody = this.$('table').find('tbody:first');

    this.listenTo(this.objs, 'reset change', this.renderAll);

    // this.objs.filter.set({
    //   limit: this.limit
    // });

    this.renderAll();

  },
  add: function(x) {
    var view = new App.Views.ObjsRow({
      el: $('<tr />').appendTo($(this.tbody)),
      obj: x,
      objs: this.objs,
    });
    this.views.push(view);
  },
  renderAll: function() {
    var self = this;

    _.each(this.views, function(x){
      x.close();
    });

    this.views = [];

    // this.$('.holder').css({
    //   height: (this.objs.filter.get('count') * this.row_h)
    // });

    if(this.objs.length === 0){
      return;
    }

    // this.$('.sizer-mid').css({
    //   height: (this.objs.filter.get('limit') * this.row_h)
    // });

    // this.$('.sizer-bottom').css({
    //   height: (this.objs.filter.get('count') * this.row_h) - (this.objs.filter.get('base') * this.row_h)  - (this.objs.filter.get('limit') * this.row_h)
    // });

    $(this.tbody).html('');

    this.objs.each(function(x) {
      self.add(x);
    });

  }
});

App.Views.ObjsRow = Backbone.View.extend({
  template : _.template('<td><a href="/objects/<%= id %>"><%= id %></td>\
<td><%= type %></td>\
<td><%= slug %></td>'),
  initialize : function(opts) {
    this.el = opts.el;
    this.delegateEvents();
    _.bindAll(this, 'render');
    this.obj = opts.obj;
    this.render();
  },
  events: {
    'click': 'onClick'
  },
  onClick: function(e){
    e.preventDefault();
    e.stopPropagation();
    App.router.navigate('objects/' + this.obj.get('id'), {trigger: true});
  },
  render : function() {
    var data = this.obj.toJSON();
    $(this.el).html(this.template(data));
  }
});

