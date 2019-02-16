import {Injectable} from "@angular/core";
import {AngularFireStorage} from "angularfire2/storage";
import * as firebase from "firebase";
import {firestore} from "firebase";
import {Article} from "../models/article";
import {User} from "../models/user";
import {ArticleComment} from "../models/article-comment";

/**
 * This class contains all functions used to manage users
 */
@Injectable()
export class ArticleService {

    constructor(private st: AngularFireStorage) {
    }

    async getDownloadImageUrl(article: Article): Promise<string> {
        if (article.imageUrl === '' || (article.imageUrl === null || article.imageUrl === undefined)) {
            throw Error("You should not try to load download url on a article without imageUrl");
        } else {
            return this.st.ref(article.imageUrl).getDownloadURL().toPromise();
        }
    }

    // noinspection JSMethodCanBeStatic
    addArticle(article: Article) {
        return firestore().collection('Articles').add({
            title: article.title,
            content: article.content,
            category: article.category,
            imageUrl: article.imageUrl,
            creation: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // noinspection JSMethodCanBeStatic
    deleteArticle(article: Article) {
        return firestore().collection('Articles').doc(article.id).delete();
    }

    // noinspection JSMethodCanBeStatic
    favArticle(article: Article, user: User) {
        article.favorite.add(user.userId);
        firestore().collection('Articles').doc(article.id).update({
            favorite: [...Array.from(article.favorite.keys())],
        });
    }

    // noinspection JSMethodCanBeStatic
    clapArticle(article: Article, user: User) {
        article.clap.add(user.userId);
        firestore().collection('Articles').doc(article.id).update({
            clap: [...Array.from(article.clap.keys())],
        });
    }

    // noinspection JSMethodCanBeStatic
    unfavArticle(article: Article, user: User) {
        article.favorite.delete(user.userId);
        firestore().collection('Articles').doc(article.id).update({
            favorite: [...Array.from(article.favorite.keys())],
        });
    }

    // noinspection JSMethodCanBeStatic
    unclapArticle(article: Article, user: User) {
        article.clap.delete(user.userId);
        firestore().collection('Articles').doc(article.id).update({
            clap: [...Array.from(article.clap.keys())],
        });
    }

    async postComment(article: Article, author: User, comment: string): Promise<void> {
        // Load previous comments to avoid override
        await this.loadComments(article);

        const result = [];
        article.addComment(new ArticleComment(author, new Date(Date.now()), comment));
        // Convert to JSON objects
        article.getComments().forEach(commentC => {
            result.push({
                author: firestore().collection('Users').doc(commentC.author.userId),
                date: commentC.date.getTime(),
                content: commentC.content
            });
        });

        return firestore().collection('Articles').doc(article.id).set({
            comments: result,
        }, {merge: true});
    }

    async loadComments(article: Article) {
        if ((article.comments === null || article.comments === undefined)) {
            article.comments = new Set();
        }
        const articleData = (await firestore().collection('Articles').doc(article.id).get()).data();
        if ((articleData.comments === null || articleData.comments === undefined)) {
            return;
        }
        const requests = [];
        articleData.comments.forEach(async comment => {
            const asyncR = comment.author.get();
            requests.push(asyncR);
            const user = User.fromDB(await asyncR);
            article.addComment(new ArticleComment(user, new Date(comment.date), comment.content));
        });
        return Promise.all(requests);
    }

    async getAllArticles(): Promise<Article[]> {
        const articles = [];
        const docs = await firestore().collection('Articles').orderBy('creation', "desc").limit(10).get();
        docs.docs.forEach(async article => {
            const art: Article = Article.fromDB(article);
            if (art.imageUrl !== '' && (art.imageUrl !== null && art.imageUrl !== undefined)) {
                art.downloadableImageUrl = await this.getDownloadImageUrl(art);
            }
            articles.push(art);
        });
        return Promise.resolve(articles);
    }

    async getAllArticlesOf(category: string): Promise<Article[]> {
        const articles = [];
        const docs = await firestore().collection('Articles')
            .where('category', '==', category)
            .orderBy('creation', "desc")
            .get();
        docs.docs.forEach(async article => {
            const art: Article = Article.fromDB(article);
            if (art.imageUrl !== '' && (art.imageUrl !== null && art.imageUrl !== undefined)) {
                art.downloadableImageUrl = await this.getDownloadImageUrl(art);
            }
            articles.push(art);
        });
        return Promise.resolve(articles);
    }

    // noinspection JSMethodCanBeStatic
    streamLastArticles(whatToDoWithArticles) {
        return firestore().collection('Articles')
            .orderBy('creation', "desc").limit(10).onSnapshot(whatToDoWithArticles);
    }

    // noinspection JSMethodCanBeStatic
    updateArticle(article: Article): Promise<void> {
        return firestore().collection('Articles').doc(article.id).set({
            title: article.title,
            content: article.content,
        }, {merge: true});
    }
}
