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
rhit.isHouseManager = false;

//From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

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

rhit.StartPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#dutiesPerformersButton").addEventListener("click", (event) => {
			rhit.isHouseManager = false;
			window.location.href = "/performers.html";
		});
		document.querySelector("#houseManagerButton").addEventListener("click", (event) => {
			//TODO: add passcode popup prompt (modal?) for managers to be able to access, add delete etc only for manager
			//NOTE: don't hardcode passcode (encryption? use uid and house manager var?)
			rhit.isHouseManager = true;
			window.location.href = "/manager.html";
		});
	}
}

rhit.PerformersPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#lowerNorthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=lowerNorth&isHouseManager=${rhit.isHouseManager}`;
		});
		document.querySelector("#lowerSouthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=lowerSouth&isHouseManager=${rhit.isHouseManager}`;
		});
		document.querySelector("#upperNorthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=upperNorth&isHouseManager=${rhit.isHouseManager}`;
		});
		document.querySelector("#upperSouthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=upperSouth&isHouseManager=${rhit.isHouseManager}`;
		});
	}
}

rhit.HallwaysPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
	}
	//TODO: implement update list and create card
	// updateList() {
	// 	const newList = htmlToElement('<div id="dutiesListContainer"></div>');

	// 	for (let i = 0; i < rhit.fbDutiesManager.length; i++) {
	// 		const mq = rhit.fbDutiesManager.getMovieQuoteAtIndex(i);
	// 		const newCard = this._createCard(mq);
	// 		newCard.onclick = (event) => {
	// 			//console.log(`You clicked on ${mq.id}`);
	// 			// rhit.storage.setMovieQuoteId(mq.id);
	// 			window.location.href = `/moviequote.html?id=${mq.id}`;
	// 		}
	// 		newList.appendChild(newCard);
	// 	}

	// 	const oldList = document.querySelector("#quoteListContainer");
	// 	oldList.removeAttribute("id");
	// 	oldList.hidden = true;

	// 	oldList.parentElement.appendChild(newList);
	// }

	// _createCard(movieQuote) {
	// 	return htmlToElement(`<div class="card">
    //     <div class="card-body">
    //       <h5 class="card-title">${movieQuote.quote}</h5>
    //       <h6 class="card-subtitle mb-2 text-muted">${movieQuote.movie}</h6>
    //     </div>
    //   </div>`)
	// }
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}
	if (document.querySelector("#startPage")) {
		new rhit.StartPageController();
	}
	if (document.querySelector("#performersPage")) {
		new rhit.PerformersPageController();
	}
	if (document.querySelector("#hallwaysPage")) {
		new rhit.HallwaysPageController();
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