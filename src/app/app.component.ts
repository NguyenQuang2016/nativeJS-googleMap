import { Component, OnInit} from '@angular/core';
import {} from '@types/googlemaps';
let this_appComponentPointer;

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
  private mutexPlaceApi = true;

  ngOnInit() {
    console.log(`OnInit`);
    /* can not use 'this' pointer in lambda expression
    please use this_appComponentPointer. fuck of typeScript/JavaScript */
    this_appComponentPointer = this;
    this.waitGoogleApisLoaded();
  }
  initNativeJsGoogleMap(): void {
    const opt: google.maps.MapOptions = {
      center: {lat: 10.729190, lng: 106.721715}, // this lat/lng should be load from datatbase
      zoom: 10
    };
    const mapDiv: HTMLDivElement = <HTMLDivElement>document.getElementById('ggmap');
    this.mapInstance = new google.maps.Map(mapDiv, opt);
    this.setUserMarker();
    this.placeService =  new google.maps.places.PlacesService(this.mapInstance);
    google.maps.event.addListener(this.mapInstance, 'dragend', () => {
      this.currentApiRequest.bounds = this.mapInstance.getBounds();
      this.DisplayMarker();
    });
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
    this.DisplayMarker();
  }

  async DisplayMarker(): Promise<void> {
    /* can not use 'this' pointer when function call paramenter function
    please use this_appComponentPointer. fuck of typeScript/JavaScript */
    if (this_appComponentPointer.currentApiRequest === null) {
      return;
    }
    await this_appComponentPointer.callPlaceApiConflictFunc(this_appComponentPointer.nearbySearch);
    for (let i = 0; i < 5; i++) {
      await this_appComponentPointer.callPlaceApiConflictFunc(this_appComponentPointer.nextPage);
    }
  }


  async setUserMarker(): Promise<void> {
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
  async callPlaceApiConflictFunc(func: () => void ): Promise<void> {
    // check locked state
    while (!this.mutexPlaceApi) {
      // waiting for release mutexPlaceApi
    }
    // lock resource when use.
    this.mutexPlaceApi = false;
    // do conflict code
    func();
    // Google rule (defend when DDoS attack): can not make more than 1 request per 2 seconds
    // delay 2 seconds before next request
    await this.delay(2000);
    // release resource when done.
    this.mutexPlaceApi = true;
  }
  /* ___________________________________end conflict code____________________________________*/
  nearbySearch(): void {
    /* can not use 'this' pointer when function call paramenter function
    please use this_appComponentPointer. fuck of typeScript/JavaScript */
    this_appComponentPointer.placeService.nearbySearch(
      this_appComponentPointer.currentApiRequest, (results, status, pagination) => {
        console.log('results:', results);
        this_appComponentPointer.PushMarkers(results);
        this_appComponentPointer.pagination = pagination;
      });
  }
  nextPage(): void {
     /* can not use 'this' pointer when function call paramenter function
    please use this_appComponentPointer. fuck of typeScript/JavaScript */

    if (this_appComponentPointer.pagination.hasNextPage) {
      this_appComponentPointer.pagination.nextPage();
    }
  }
  async PushMarkers(marker_arg: google.maps.places.PlaceResult[]): Promise<void> {
    console.log('PushMarkers');
    if (marker_arg === null) {
      return;
    }
    for (const place_iterator of marker_arg) {
      const lat = place_iterator.geometry.location.lat();
      const lng = place_iterator.geometry.location.lng();
      const markersOpt: google.maps.MarkerOptions = {
        icon: {
          url: 'assets/Bank.png',
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

