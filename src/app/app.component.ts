import { Component, OnInit} from '@angular/core';
import {} from '@types/googlemaps';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'app';
  ngOnInit() {
    console.log(`OnInit`);
    this.waitGoogleApisLoaded();
  }
  initNativeJsGoogleMap(): void {

    const opt: google.maps.MapOptions = {
      center: {lat: -34.397, lng: 150.644},
      zoom: 8
    };
    const mapDiv: HTMLDivElement = <HTMLDivElement>document.getElementById('ggmap');
    const m = new google.maps.Map(mapDiv, opt);
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

}

