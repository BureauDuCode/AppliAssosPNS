import {Component} from '@angular/core';

import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {User} from "./models/user";
import {PopupService} from "./services/popup.service";
import {Router, RoutesRecognized} from "@angular/router";
import {UserService} from "./services/user.service";

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    connectedUser: User;

    currentRoute: string;

    mobileMenuOpened: boolean;
    displayAssosPages: boolean;

    isLogged = false;

    constructor(
        private platform: Platform,
        private userService: UserService,
        private popupService: PopupService,
        private router: Router,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar) {
        this.initializeApp();
        this.currentRoute = '';
        this.mobileMenuOpened = false;
        this.displayAssosPages = false;
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();
        });
    }

    async ngOnInit() {
        this.router.events.subscribe(event => {
            if (event instanceof RoutesRecognized) {
                this.currentRoute = event.url;
            }
        });

        this.connectedUser = await this.userService.getLoggedUser();
        if (this.connectedUser !== null) {
            this.isLogged = true;
        }
        (await this.userService.streamLoggedUser()).subscribe(user => {
            if (user === null && this.connectedUser !== null) {
                // Disconnect from user
                this.isLogged = false;
                this.router.navigate(['/']);
            } else {
                this.isLogged = true;
            }
            this.connectedUser = user;
        });


        // Open popup to inform of cookie using
        if (localStorage.getItem("knowCookies") !== 'true') {
            setTimeout(() => {
                // Must open only if the user never said ok
                this.popupService.openCookiePopup();
            }, 1500);
        }
    }

    disconnect() {
        this.userService.disconnectUser();
    }
}
