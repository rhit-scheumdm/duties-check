/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Dylan Scheumann and Jack Speedy
 */

/** namespace. */
var rhit = rhit || {};

rhit.fbAuthManager = null;

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		Rosefire.signIn("ebd11048-b350-43b4-a442-adaf96f1f48d", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
					console.log(`Custom auth error ${errorCode} ${errorMessage}`);
				}
			});
		});

	}
	signOut() {
		firebase.auth().signOut().catch(function (error) {
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/start.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
}

rhit.StartPage = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}
	if (document.querySelector("#startPage")) {
		new rhit.StartPage();
	}
}

rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log(`isSignedIn = ${rhit.fbAuthManager.isSignedIn}`);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();