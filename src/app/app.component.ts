import { Component, OnInit} from '@angular/core';
import {} from '@types/googlemaps';
let _this;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'app';
  placeService: google.maps.places.PlacesService;
  pagination: google.maps.places.PlaceSearchPagination;
  currentApiRequest: google.maps.places.PlaceSearchRequest = null;
  mapInstance: google.maps.Map;
  userPosition: google.maps.LatLngLiteral;
  iconUrl: string;
  requestFuncQueue: any[] = [];
  mutexRequestFuncQueue = true;
  private mutexPlaceApi = true;

  ngOnInit() {
    console.log(`OnInit`);
    /* can not use 'this' pointer when function call paramenter function
    please use _this. fuck of typeScript/JavaScript */
    _this = this;
    this.waitGoogleApisLoaded();
  }
  initNativeJsGoogleMap(): void {
    const opt: google.maps.MapOptions = {
      center: {lat: 10.729190, lng: 106.721715}, // this lat/lng should be load from datatbase
      zoom: 10
    };
    const mapDiv: HTMLDivElement = <HTMLDivElement>document.getElementById('ggmap');
    this.mapInstance = new google.maps.Map(mapDiv, opt);
    this.setUserMarkerAsync();
    this.placeService =  new google.maps.places.PlacesService(this.mapInstance);
    google.maps.event.addListener(this.mapInstance, 'dragend', () => {
      if (this.currentApiRequest === null) {
        return;
      }
      this.currentApiRequest.bounds = this.mapInstance.getBounds();
      this.DisplayMarkerAsync();
    });
    this.QueueProcessAsync();
  }

  async waitGoogleApisLoaded(): Promise<void> {
    await this.delay(500);
    this.initNativeJsGoogleMap();
  }

  delay(milliseconds: number): Promise<number> {
    return new Promise<number>(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
  }

  // function interact with UI component
  DisplayBank() {
    this.currentApiRequest = {
      bounds: this.mapInstance.getBounds(),
      type: 'bank',
    };
    this.iconUrl = 'assets/Bank.png';
    this.DisplayMarkerAsync();
  }
  DisplayCafe() {
    this.currentApiRequest = {
      bounds: this.mapInstance.getBounds(),
      type: 'cafe',
    };
    this.iconUrl = 'assets/Cafe.png';
    this.DisplayMarkerAsync();
  }
  DisplayAtm() {
    this.currentApiRequest = {
      bounds: this.mapInstance.getBounds(),
      type: 'atm',
    };
    this.iconUrl = 'assets/Atm.png';
    this.DisplayMarkerAsync();
  }

  async DisplayMarkerAsync(): Promise<void> {

    if (this.currentApiRequest === null) {
      return;
    }

  /* ______________________________________conflict code______________________________________*/
     while (!this.mutexRequestFuncQueue) {  /* waiting */  }
    this.mutexRequestFuncQueue = false;
    if (this.requestFuncQueue.length > 0) {
      // may be this code will generate a big memory bug if "memory recovery" in js may be work wrong
      this.requestFuncQueue.splice(0, this.requestFuncQueue.length);
    }
    this.requestFuncQueue.push(this.nearbySearch );
     for (let i = 0; i < 3; i++) {
      this.requestFuncQueue.push(this.nextPage);
     }
     this.mutexRequestFuncQueue = true;
  }


  async setUserMarkerAsync(): Promise<void> {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log(position.coords);
        this.userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.mapInstance.setCenter(this.userPosition);
        const markersOpt: google.maps.MarkerOptions = {
          icon: {
            url: 'assets/userPos.png',
            scaledSize: new google.maps.Size(50, 50),
            labelOrigin: new google.maps.Point(25, 0),
          },
          draggable: false,
          position: this.userPosition,
          label: {
            color: 'blue',
            text: 'User position',
          },
        };
        const user_marker = new google.maps.Marker( markersOpt);
        user_marker.setMap(this.mapInstance);
        this.mapInstance.setZoom(15);
      });
    }
  }

  /* ______________________________________conflict code______________________________________*/
  async QueueProcessAsync(): Promise<void> {
    while (true ) {
    // check locked state
      while (!this.mutexRequestFuncQueue) {  /* waiting */  }
    // lock resource when use.
      this.mutexRequestFuncQueue = false;
      if (this.requestFuncQueue.length !== 0) {

        const messfunc = this.requestFuncQueue.shift();
        messfunc();
      }
    // release resource when done.
      this.mutexRequestFuncQueue = true;
      // Google rule (defend when DDoS attack): can not make more than 1 request per 2 seconds
      // delay 2 seconds before next request
      await this.delay(2000);
    }
  }
  /* ___________________________________end conflict code____________________________________*/
  nearbySearch(): void {
    /* can not use 'this' pointer when function call paramenter function
    please use _this. fuck of typeScript/JavaScript */
    _this.placeService.nearbySearch(
      _this.currentApiRequest, (results, status, pagination) => {
        console.log('results:', results);
        _this.PushMarkersAsync(results);
        _this.pagination = pagination;
      });
  }
  nextPage(): void {
    /* can not use 'this' pointer when function call paramenter function
    please use _this. fuck of typeScript/JavaScript */
    if (_this.pagination.hasNextPage) {
      _this.pagination.nextPage();
    }
  }
  async PushMarkersAsync(marker_arg: google.maps.places.PlaceResult[]): Promise<void> {
    // need to clear marker
    // implement in here:
    // ...
    console.log('PushMarkers');
    if (marker_arg === null) {
      return;
    }
    for (const place_iterator of marker_arg) {
      const lat = place_iterator.geometry.location.lat();
      const lng = place_iterator.geometry.location.lng();
      const markersOpt: google.maps.MarkerOptions = {
        icon: {
          url: this.iconUrl,
          scaledSize: new google.maps.Size(50, 50),
          labelOrigin: new google.maps.Point(25, 0),
        },
        draggable: false,
        position: {lat: lat, lng: lng },
      };
      const user_marker = new google.maps.Marker( markersOpt);
      user_marker.setMap(this.mapInstance);
    }
  }
}

