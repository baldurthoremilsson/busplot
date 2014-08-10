var BASEURL = BASEURL || '';

var ICONS = {
  red: L.icon({iconUrl: 'img/reddot.png'}),
  green: L.icon({iconUrl: 'img/greendot.png'}),
  cyan: L.icon({iconUrl: 'img/cyandot.png'}),
  blue: L.icon({iconUrl: 'img/bluedot.png'}),
};


function getColor(routeId) {
  var iId = parseInt(routeId);
  if(isNaN(iId))
    return 'blue';
  if(iId < 10)
    return 'red';
  if(iId < 20)
    return 'green';
  if(iId < 50)
    return 'cyan';
  return 'blue';
}


function getIcon(routeId) {
  return ICONS[getColor(routeId)];
}


var BusControl = L.Control.extend({
  options: {
    position: 'bottomleft',
  },

  initialize: function() {
    this.container = L.DomUtil.create('div', 'leaflet-control-routes');
    this.controlGroups = {};
    this.map = undefined;
    this.activeLayer = undefined;
    this.activeButton = undefined;
    L.Control.prototype.initialize.call(this, arguments);
  },

  addRoute: function(routeId, layer) {
    var self = this;
    var button = this._createButton(routeId, 'Sýna leið ' + routeId, '', this.getControlGroup(routeId), function() {
      self.setLayer(layer);
      self.activeButton.classList.remove('active');
      self.activeButton = this;
      self.activeButton.classList.add('active');
    });

    if(this.activeLayer === undefined) {
      this.activeLayer = layer;
      this.activeButton = button;
      this.activeButton.classList.add('active');
    }
  },

  getControlGroup: function(routeId) {
    var color = getColor(routeId);
    if(this.controlGroups[color] === undefined) {
      var routeGroupContainer = L.DomUtil.create('div', 'route-group-container', this.container);
      this.controlGroups[color] = L.DomUtil.create('div', 'leaflet-bar route-group ' + color, routeGroupContainer);
    }
    return this.controlGroups[color];
  },

  onAdd: function (map) {
    this.map = map;
    this.map.addLayer(this.activeLayer);
    return this.container;
  },

  setLayer: function(layer) {
    if(this.map === undefined)
      return
    this.map.removeLayer(this.activeLayer);
    this.activeLayer = layer;
    this.map.addLayer(layer);
  },

  _createButton: L.Control.Zoom.prototype._createButton,
});


window.addEventListener('load', function() {
  // create a map in the "map" div, set the view to a given place and zoom
  var map = L.map('map').setView([64.105491, -21.896149], 12);

  // add an OpenStreetMap tile layer
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


  $.getJSON(BASEURL + 'points.php', function(data) {
    var layers = {};
    var busControl = new BusControl();
    for(var routeId in data) {
      if(routeId === '')
        continue;
      var layer = L.layerGroup();
      data[routeId].forEach(function(point) {
        L.marker(point, {icon: getIcon(routeId), clickable: false}).addTo(layer);
      });
      layers[routeId] = layer;
      busControl.addRoute(routeId, layer);
    }
    map.addControl(busControl);
  });
});
