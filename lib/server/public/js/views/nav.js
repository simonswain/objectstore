/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Nav = Backbone.View.extend({
  template: _.template('<ul>\
<li><a href="/">Objects</a></li>\
</ul>'),
  initialize : function(opts) {
    this.render();
  },
  render : function() {
    var data = {};
    this.$el.html(this.template(data));
  }
});
