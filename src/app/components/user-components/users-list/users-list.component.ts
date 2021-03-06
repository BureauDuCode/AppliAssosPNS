import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {UserService} from "../../../services/user.service";
import {User} from "../../../models/user";

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
    @Input()
    pageStep: number;

    @Input()
    title: string;

    @Output()
    selectedUser = new EventEmitter<User>();
    displayedUsers: User[];
    page = 0;
    searchField: string;
    loading: boolean;
    private users: User[];

    constructor(private userService: UserService) {
        this.users = [];
        this.displayedUsers = this.users;
        this.pageStep = 10;
        this.searchField = '';
        this.title = null;
        this.loading = true;
    }

    async ngOnInit() {
        // We get all reported users
        this.users = await this.userService.getUsers();
        this.updateList();
        this.loading = false;

        // Once we have reported users we try to get their downloadPhotoUrl
        this.users.forEach(async user => {
            if ((user.photoUrl !== null && user.photoUrl !== undefined) && user.photoUrl !== '') {
                user.downloadPhotoUrl = await this.getDownloadUrl(user);
            }
        });
    }

    updateList() {
        this.displayedUsers = [];
        const keywords = this.searchField.split(' ');
        this.users.forEach(user => {
            if (this.searchField === '') {
                this.displayedUsers.push(user);
            } else {
                // Perform search
                keywords.forEach(keyword => {
                    if (user.firstName.toLowerCase().includes(keyword.toLowerCase())
                        || user.lastName.toLowerCase().includes(keyword.toLowerCase())) {
                        this.displayedUsers.push(user);
                    }
                });
            }
        });
    }

    getUrl(user: User) {
        if ((user.downloadPhotoUrl !== null && user.downloadPhotoUrl !== undefined)) {
            return {
                'background-image': 'url(\'' + user.downloadPhotoUrl + '\')'
            };
        } else {
            return {'background-image': 'url(\'assets/user_placeholder_square.png\')'};
        }
    }

    select(user: User): void {
        this.selectedUser.emit(user);
    }

    // region ===== Pagination =====
    previousPage() {
        --this.page;
    }

    // region ===== Filters ========

    // endregion

    nextPage() {
        ++this.page;
    }

    isLastPage() {
        return this.displayedUsers.length < ((this.page + 1) * this.pageStep);
    }

    private async getDownloadUrl(user: User) {
        return await this.userService.getDownloadUrl(user.photoUrl);
    }

    // endregion
}
