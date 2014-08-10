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


var AboutPopup = L.Popup.extend({
  content:
    '<h1>BusPlot</h1>' +
    '<p>Þessi síða birtir staðsetningu strætisvagna síðustu vikuna. ' +
    'Hún velur 500 hnit af handahófi á hverri leið og teiknar inn á kortið. ' +
    'Gögnin koma frá <a href="http://www.straeto.is">Strætó</a>, en síðan ' +
    'tengist Strætó bs. ekki að öðru leiti.</p>' +
    '<p>Höfundur er <a href="mailto:baldur@baldur.biz">Baldur Þór Emilsson</a> ' +
    'og kóðann á bakvið síðuna má finna á ' +
    '<a href="https://github.com/baldurthoremilsson/busplot">GitHub</a>.</p>',

  loading: function() {
    this.setContent(this.content +
      '<p>Sæki gögn <img src="img/spinner.gif"></p>');
  },

  loaded: function() {
    this.setContent(this.content);
  },

  loadingFailed: function(callback) {
    var div = L.DomUtil.create('div');
    div.innerHTML = this.content;

    var span = L.DomUtil.create('span', '', div);
    span.innerHTML = 'Gat ekki náð í gögnin. ';

    var button = L.DomUtil.create('a', '', div);
    button.innerHTML = 'Reyna aftur';
    button.href = '#';
    L.DomEvent
      .on(button, 'mousedown dblclick', L.DomEvent.stopPropagation)
      .on(button, 'click', L.DomEvent.stop)
      .on(button, 'click', callback, this);

    this.setContent(div);
  },

  onAdd: function(map) {
    this.visible = true;
    L.Popup.prototype.onAdd.call(this, map);
  },

  onRemove: function(map) {
    this.visible = false;
    L.Popup.prototype.onRemove.call(this, map);
  },

  _createButton: L.Control.Zoom.prototype._createButton,
});


var AboutControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  initialize: function() {
    this.popup = new AboutPopup();
    L.Control.prototype.initialize.call(this);
  },

  onAdd: function(map) {
    this.map = map;
    this.openPopup();

    var container = L.DomUtil.create('div', 'leaflet-bar');
    var button = this._createButton('?', 'Um síðuna', '', container, this.togglePopup.bind(this));
    return container;
  },

  openPopup: function() {
    this.popup.setLatLng(this.map.getCenter());
    this.popup.openOn(this.map);
  },

  closePopup: function() {
    this.map.closePopup(this.popup);
  },

  togglePopup: function() {
    if(this.popup.visible)
      this.closePopup();
    else
      this.openPopup();
  },

  _createButton: L.Control.Zoom.prototype._createButton,
});


function loadRoutes(map, aboutControl, busControl) {
  aboutControl.popup.loading();
  $.getJSON(BASEURL + 'points.php', function(routes) {
    var layers = {};
    for(var routeId in routes) {
      if(routeId === '')
        continue;
      var layer = L.layerGroup();
      routes[routeId].forEach(function(point) {
        L.marker(point, {icon: getIcon(routeId), clickable: false}).addTo(layer);
      });
      layers[routeId] = layer;
      busControl.addRoute(routeId, layer);
    }
    map.addControl(busControl);
    aboutControl.popup.loaded();
  }).fail(function() {
    aboutControl.popup.loadingFailed(function() {
      loadRoutes(map, aboutControl, busControl);
    })
  });

}

window.addEventListener('load', function() {
  // create a map in the "map" div, set the view to a given place and zoom
  var map = L.map('map').setView([64.135491, -21.896149], 12);

  // add an OpenStreetMap tile layer
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

  var aboutControl = new AboutControl();
  map.addControl(aboutControl);

  var busControl = new BusControl();

  loadRoutes(map, aboutControl, busControl);
});
