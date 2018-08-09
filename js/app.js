var map;

var placeCategoryModel = [
    {
        name: 'Restaurant',
        imgSrc: 'img/restaurants.png'
    },
    {
        name: 'Hotel',
        imgSrc: 'img/hotels.png'
    },
    {
        name: 'Coffee',
        imgSrc: 'img/coffee.png'
    },
    {
        name: 'Park',
        imgSrc: 'img/parks.png'
    },
    {
        name: 'Grocery',
        imgSrc: 'img/groceries.png'
    },
    {
        name: 'Hospital',
        imgSrc: 'img/hospitals.png'
    },
    {
        name: 'Bank',
        imgSrc: 'img/banks.png'
    },
    {
        name: 'School',
        imgSrc: 'img/schools.png'
    }
]

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

var Category = function (data) {
    this.name = ko.observable(data.name);
    this.imgSrc = ko.observable(data.imgSrc);
};

var Place = function () {
    this.lat = '';
    this.lng = '';
    this.id = '';
    this.name = '';
    this.address = '';
};

var ViewModel = function () {
    var self = this;
    this.city = ko.observable("Ahmedabad");
    this.category = ko.observable("All");
    this.places = ko.observableArray([]);
    this.categoryList = ko.observableArray([]);
    this.largeInfoWindow = new google.maps.InfoWindow();
    this.markers = ko.observableArray([]);

    placeCategoryModel.forEach(function (place) {
        self.categoryList.push(new Category(place));
    });

    this.initMap = function () {
        // Constructor creates a new map - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 23.022505, lng: 72.5713621 },
            zoom: 13,
            styles: styles,
            mapTypeControl: false
        });

        // Create a searchbox in order to execute a places search
        var searchBox = new google.maps.places.SearchBox(
            document.getElementById('cityName'));

        // Bias the searchbox to within the bounds of the map.
        searchBox.setBounds(map.getBounds());

        // Call function to find places near by the location.
        self.findPlaces('All');
    };

    this.centerToCity = function () {
        // Initialize the geocoder.
        var geocoder = new google.maps.Geocoder();
        var address;
        var location;

        // Get the name of city which is entered by the user.
        address = document.getElementById('cityName').value;

        // Geocode the area entered to get the center.
        // Then, center the map on it and zoom in.
        geocoder.geocode(
            {
                address: address,
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    location = results[0].geometry.location;
                    map.setCenter(location);
                    map.setZoom(15);
                    self.city(address);
                    self.findPlaces('All');
                } else {
                    window.alert('We could not find that location.\n Please try again by entering a more specific city name.');
                }
            });
    };

    this.findPlaces = function (category) {
        var fsClientId = "23VMCURUL4NQ2EKS2TGI1MNMKWWLZCLPE2GQIGAQLXA5UGBW";
        var fsClientSecret = "DBINMUM0HO2GJKBWTSOOCSOPPYNZKDLZENJOMXQIRYPEO10K";
        var near = self.city();
        var query;
        if (category == 'All') {
            query = '';
        } else {
            query = this.name();
        }
        self.places().splice(0, self.places().length);
        for(var i = 0; i < self.markers().length; i++) {
            self.markers()[i].setMap(null);
        }
        self.markers().splice(0, self.markers().length);

        var fsUrl = "https://api.foursquare.com/v2/venues/search?" + "client_id=" + fsClientId + "&client_secret=" + fsClientSecret + "&v=20180809&near=" + near + "&query=" + query + '&limit=8&intent=checkin';
        var places;
        $.getJSON(fsUrl).done(function (data) {
            if (category == 'All') {
                self.category('All');
            } else {
                self.category(query);
            }
            places = data.response.venues;
            for (var i = 0; i < places.length; i++) {
                var dataToSave = new Place();
                dataToSave.name = places[i].name;
                dataToSave.lat = places[i].location.lat;
                dataToSave.lng = places[i].location.lng;
                dataToSave.id = places[i].id;
                dataToSave.address = places[i].location.formattedAddress;
                self.places.push(dataToSave);
            }
        }).complete(function () {
            self.setMarkers();
        }).fail(function () {
            var ele = document.getElementById('errorMsg');
            ele.classList.remove('errorMsg');
        });
    };

    this.setMarkers = function () {
        // Style the markers a bit. This will be our listing marker icon.
        var defaultIcon = makeMarkerIcon('0091ff');
        // Create a "highlighted location" marker color for when the user mouses over the marker.
        var highlightedIcon = makeMarkerIcon('FFFF24');

        // loop over an array to create an array of markers.
        for (var i = 0; i < self.places().length; i++) {
            this.markerTitle = self.places()[i].name;
            this.markerLat = self.places()[i].lat;
            this.markerLng = self.places()[i].lng;
            this.markerAddress = self.places()[i].address;
            // set the marker on the map.
            this.marker = new google.maps.Marker({
                map: map,
                position: {
                    lat: this.markerLat,
                    lng: this.markerLng
                },
                title: this.markerTitle,
                lat: this.markerLat,
                lng: this.markerLng,
                id: i,
                address: this.markerAddress,
                icon: defaultIcon,
                animation: google.maps.Animation.DROP
            });
            self.markers.push(this.marker);

            // change the color to yellow of a marker when mouseover on it.
            this.marker.addListener('mouseover', function () {
                this.setIcon(highlightedIcon);
            });
            // change the color to blue(default) of a marker when mouseover on it.
            this.marker.addListener('mouseout', function () {
                this.setIcon(defaultIcon);
            });
            // set animation to the marker when clicked.
            this.marker.addListener('click', self.bounceMarker);
        }
    };

    this.populateInfoWindow = function (marker, infoWindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infoWindow.marker != marker) {
            // Clear the infowindow content
            infoWindow.setContent('');
            infoWindow.marker = marker;

            // Make sure the marker property is cleared if the infowindow is closed.
            infoWindow.addListener('closeclick', function () {
                infoWindow.marker = null;
            });

            var address = '';
            for(var i = 0; i < marker.address.length; i++) {
                address += marker.address[i] + ', ';
            }
            var contentString = '<div class="media">' +
                                '<div class="media-body">' +
                                '<h5 class="mt-0">' + marker.title + '</h5>' +
                                address +
                                '</div>' +
                                '</div>';
            
            infoWindow.setContent(contentString);

            // Open the infowindow on the correct marker.
            infoWindow.open(map, marker);
        }

    };

    this.bounceMarker = function () {
        self.populateInfoWindow(this, self.largeInfoWindow);
        this.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout((function () {
            this.setAnimation(null);
        }).bind(this), 2000);
    };


    this.initMap();
}

function googleMapError() {
    alert("Can't load map, Please try again!");
}

function viewMap() {
    ko.applyBindings(new ViewModel());
}