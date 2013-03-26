window.jsFileName = 'plugin.js';
//window.jsProductionPath = 'fast.wistia.com/labs/logo-over-video';
window.jsProductionPath = 'argo/logo-over-video';

Math.PHI = 1.6180339887505;
var debug = true;

// A reasonably safe log function.
function log(){
  if (debug && (console !== undefined)) { console.log.apply(console, arguments); }
};

// Given a base element and a wistia embed object, create a scaled placement
// grid. Objects added to this grid will be draggable, and their relative
// position on the video itself is calculated using scale factors.
//
// The width of the container element should be defined via css, the height
// will be generated automatically using the aspect ratio of the embed object.
//
// Usage:
//
//   // Create a new minimap.
//   var mini_map = new MiniMap(container_element, wistia_embed_object);
//
//   // Scale and add a draggable item at the specified offset.
//   mini_map.addItem('foo', foo_elem, [offset_x, offset_y]);
//
function MiniMap(elem, embed){
  var self = this;
  this._objects = {};
  this._elem = elem;
  this._embed = embed;

  // TODO: There has to be a better way.
  try {
    // An ApiEmbedCode will return a string suffixed by 'px'.
    this._embed_width = parseInt(this._embed.width().slice(0,-2));
    this._embed_height = parseInt(this._embed.height().slice(0,-2));
  } catch (err) {
    // An IframeEmbedCode will return an integer.
    this._embed_width = parseInt(this._embed.width());
    this._embed_height = parseInt(this._embed.height());
  }

  this._base_width = $(this._elem).width();
  this._base_height = Math.round(this._base_width * this._embed_height / this._embed_width);

  // Set the container height.
  $(this._elem).addClass('minimap').css('height', this._base_height);

  // Determine scaling factors.
  this._x_scale = this._base_width / this._embed_width;
  this._y_scale = this._base_height / this._embed_height;

  // Calculate snap-to grid dimensions.
  this._grid_dimensions = [Math.round(6 * this._x_scale), Math.round(4 * this._y_scale)];

  // Remove all draggable items from the grid.
  this.clear = function(){
    $(this._elem).find('.minimap-object').remove();
    this._objects = {};
  };

  // Add a draggable element to the grid. The dimensions of this element will
  // be scaled using the relative size difference between the grid and embed.
  // The offset coordinates will also be re-scaled appropriately.
  this.addItem = function(name, elem, offset_coord){
    var self = this;
    this._objects[name] = elem;

    $(elem).addClass('minimap-object').css({
      'width': Math.round(parseFloat(elem.width) * this._x_scale) + 'px',
      'height': 'auto',
      'cursor': 'move',
    });

    // Position the element according to an offset, if specified.
    if (offset_coord !== undefined) {
      // Fix the offset x coordinate.
      offset_coord[0] = this._base_width - ((offset_coord[0] * this._x_scale) + $(elem).width());
      $(elem).css({
        'left': Math.round(offset_coord[0]) + 'px',
        'top': Math.round(offset_coord[1] * this._y_scale) + 'px',
      });
    } else {
      $(elem).css({
        'left': '0px',
        'top': '0px',
      });
    }

    $(this._elem).append(elem);

    // Add draggable functionality and events.
    $(elem).draggable({
      containment: 'parent', //this._elem, //'.wlov-contain',
      scroll: false,
      //grid:   this._grid_dimensions,
      //drag: function(e){ $(self).trigger(name + '-' + 'drag',  self.posFor(name));

      //  var pos = self.posFor(name);
      //  log("DRAG:", pos.offset);
      //  var px = pos.offset[0];
      //  var py = pos.offset[1];
      //  var bx = self._base_width;
      //  var by = self._base_height;

      //  var mxf = Math.pow(Math.PHI, 1);
      //  var myf = Math.pow(Math.PHI, 2);

      //  var xl1 = bx / mxf;
      //  var xl2 = bx - (bx / mxf);
      //  var yl1 = by / myf;
      //  var yl2 = by - (by / myf);
      //  console.log("LIMITS:", Math.round(xl1), Math.round(xl2), Math.round(yl1), Math.round(yl2));

      //  $('#wlov-inner-containment').css({
      //    'top':    Math.round(yl2/2) + 'px',
      //    'left':   Math.round(xl2/2) + 'px',
      //    'width':  Math.round(xl1) + 'px',
      //    'height': Math.round(yl1) + 'px',
      //  });

      //},
      start:  function(e){ $(self).trigger(name + '-' + 'start', self.posFor(name)); },
      stop:   function(e){ $(self).trigger(name + '-' + 'stop',  self.posFor(name)); }
    });
  };

  // Retrieve the video grid corner to use for this object.
  this.videoGrid = function(name) {
    // Find the coordinate offset of the center.
    var c_off = this.centerOf(name);

    var xo = c_off[0];
    var yo = c_off[1];

    var x0 = this._base_width / 2;
    var y0 = this._base_height / 2;

    // Find the right quadrant.
    var quadrant = null;
    if ( (xo <= x0) && (yo <= y0) ){
      quadrant = 'top_inside';
    } else if ( (xo > x0) && (yo <= y0) ){
      quadrant = 'right_inside';
    } else if ( (xo > x0) && (yo > y0) ){
      quadrant = 'bottom_inside';
    } else if ( (xo <= x0) && (yo > y0) ){
      quadrant = 'left_inside';
    }

    return quadrant;
  };

  // Retrieve the centroid coordinate for a minimap object.
  this.centerOf = function(name) {
    log("Finding center coordinate:", name);
    var off_xy = [$(this._objects[name]).css('left'), $(this._objects[name]).css('top')].map(function(x){ return parseInt(x.slice(0, -2)); });
    var size_xy = [$(this._objects[name]).css('width'), $(this._objects[name]).css('height')].map(function(x){ return parseInt(x.slice(0, -2)); });
    log(off_xy, size_xy);

    // Return the offset of the object's center.
    return [off_xy[0] + (size_xy[0] / 2), off_xy[1] + (size_xy[1] / 2)];
  };

  // TODO: refactor me!
  // Retrieve the embed position mapping for the item.
  this.posFor = function(name) {
    var base_coord = [$(this._objects[name]).css('left'), $(this._objects[name]).css('top')].map(function(x){ return parseInt(x.slice(0, -2)); });
    //base_coord[0] = this._base_width - (base_coord[0] + $(this._objects[name]).width());

    var grid_pos = this.videoGrid(name);
    var off_c = [];

    // Transform offsets based on grid position.
    switch(grid_pos){
      case 'top_inside':
        //base_coord[0] = this._base_width - (base_coord[0] + $(this._objects[name]).width());
        off_c = [ Math.round(base_coord[0] / this._x_scale), Math.round(base_coord[1] / this._y_scale)];
        break;
      case 'right_inside':
        base_coord[0] = this._base_width - (base_coord[0] + $(this._objects[name]).width());
        off_c = [ Math.round(base_coord[0] / this._x_scale), Math.round(base_coord[1] / this._y_scale)];
        break;
      case 'bottom_inside':
        base_coord[0] = this._base_width - (base_coord[0] + $(this._objects[name]).width());
        base_coord[1] = this._base_height - base_coord[1] - $(this._objects[name]).height();
        off_c = [ Math.round(base_coord[0] / this._x_scale), Math.round(base_coord[1] / this._y_scale)];
        break;
      case 'left_inside':
        //base_coord[0] = -1 * (base_coord[0] + $(this._objects[name]).width());
        base_coord[1] = this._base_height - base_coord[1] - $(this._objects[name]).height();
        off_c = [ Math.round(base_coord[0] / this._x_scale), Math.round(base_coord[1] / this._y_scale)];
        break;
    };

    // Return the video grid position and the properly transformed offset coordinates.
    return { grid: grid_pos, offset: off_c };
  };

  // Add event handlers for movement.
  this.on = function(event_name, callback) {
    $(this).bind(event_name, callback);
  };
}

// TODO: Refactor!
var logo_minimap;

// ---- Initialize UI grid for logo placement.
function updateLogoGrid(oembed, callback){
  // Initialize the video grid, if necessary.
  if (logo_minimap === undefined) {
    logo_minimap = new MiniMap($('#wlov-grid')[0], oembed);

    // Add an event handler to update the input fields.
    logo_minimap.on('logo-stop', function(e, mapping){
      $('#logo_pos').val(mapping.grid);
      $('#logo_x_offset').val(mapping.offset[0]);
      $('#logo_y_offset').val(mapping.offset[1]);

      if (wistiaEmbed !== undefined) {
        wistiaEmbed.plugin.logoOverVideo.pos(mapping.offset[0], mapping.offset[1], mapping.grid);
      }
    });
  } else {
    logo_minimap.clear();
  }

  // Create the logo image element.
  var $logo = $('<img/>');

  // Bind a handler to the load event.
  $logo.load(function(e){
    // Set the logo dimension text fields.
    $('#logo_height').val(e.target.height);
    $('#logo_width').val(e.target.width);

    // Execute the callback to finish loading behavior.
    callback();

    // Add the logo element to the draggable grid.
    logo_minimap.addItem('logo', e.target, [parseInt($('#logo_x_offset').val()), parseInt($('#logo_y_offset').val())]);
  });

  // Set the src to trigger image loading.
  $logo.attr('src', $('#logo_url').val());
}

function updateOutput() {
  var sourceEmbedCode = Wistia.EmbedCode.parse($("#source_embed_code").val());
  var outputEmbedCode = Wistia.EmbedCode.parse($("#source_embed_code").val());

  if (sourceEmbedCode && sourceEmbedCode.isValid()) {

    // TODO: refactor me
    function finishUpdate(output_embed) {
      log(pluginSrc(sourceEmbedCode));
      // Set custom options on the embed code.
      output_embed.setOption('plugin.logoOverVideo.src',          'http://argo/logo-over-video/plugin.js');
      output_embed.setOption('plugin.logoOverVideo.debug',        true);
      output_embed.setOption('plugin.logoOverVideo.pos',          $('#logo_pos').val());
      output_embed.setOption('plugin.logoOverVideo.xOffset',      parseInt($('#logo_x_offset').val()));
      output_embed.setOption('plugin.logoOverVideo.yOffset',      parseInt($('#logo_y_offset').val()));
      output_embed.setOption('plugin.logoOverVideo.logoUrl',      $('#logo_url').val());
      output_embed.setOption('plugin.logoOverVideo.logoLink',     $('#logo_link').val());
      output_embed.setOption('plugin.logoOverVideo.logoTitle',    $('#logo_title').val());
      output_embed.setOption('plugin.logoOverVideo.opacity',      parseFloat($('#logo_opacity').val().slice(0,-1)) / 100.0);
      output_embed.setOption('plugin.logoOverVideo.hoverOpacity', parseFloat($('#logo_hover_opacity').val().slice(0,-1)) / 100.0);

      $("#output_embed_code").val(output_embed.toString());
      output_embed.previewInElem('preview');

      return output_embed;
    }
    
    // Update the logo grid, then trigger a full refresh.
    updateLogoGrid(outputEmbedCode, function(){
      finishUpdate(outputEmbedCode);
    });

  } else {

    // Show an error if invalid. We can be more specific 
    // if we expect a certain problem.
    $("#output_embed_code").val("Please enter a valid Wistia embed code.");
    $("#preview").html('<div id="placeholder_preview">Your video here</div>');
  }
}


// Updating is kind of a heavy operation; we don't want to 
// do it on every single keystroke.
var updateOutputTimeout;
function debounceUpdateOutput() {
  clearTimeout(updateOutputTimeout);
  updateOutputTimeout = setTimeout(updateOutput, 500);
}


// Assign all DOM bindings on doc-ready in here. We can also 
// run whatever initialization code we might need.
window.setupLabInterface = function($) {
  $(function() {
    // Update the output whenever a configuration input changes.
    $("#configure")
      .on("keyup", "input[type=text], textarea", debounceUpdateOutput)
      .on("change", "select", debounceUpdateOutput)
      .on("click", ":radio,:checkbox", debounceUpdateOutput);
  });

  $(function() {
    // Logo UI interactions.
    $( "#logo_opacity_slider" ).slider({
      range: "min",
      min: 0.0,
      max: 100.0,
      value: 33.0,
      slide: function( event, ui ) {
        $( "#logo_opacity" ).val( ui.value + '%' );
        //$('#logo_opacity').focus().val(ui.value + '%').keyup().blur();
        if (wistiaEmbed !== undefined) {
          wistiaEmbed.plugin.logoOverVideo.defaultOpacity(parseFloat(ui.value) / 100.0);
        }
      }
    });
    $( "#logo_opacity" ).val( $( "#logo_opacity_slider" ).slider( "value" ) + '%' );

    $( "#logo_hover_opacity_slider" ).slider({
      range: "min",
      min: 0.0,
      max: 100.0,
      value: 90.0,
      slide: function( event, ui ) {
        $( "#logo_hover_opacity" ).val( ui.value + '%' );
        //$('#logo_hover_opacity').focus().val(ui.value + '%').keyup().blur();
        if (wistiaEmbed !== undefined) {
          wistiaEmbed.plugin.logoOverVideo.hoverOpacity(parseFloat(ui.value) / 100.0);
        }
      }
    });
    $( "#logo_hover_opacity" ).val( $( "#logo_hover_opacity_slider" ).slider( "value" ) + '%' );
  });

};
