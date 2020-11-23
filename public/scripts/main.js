/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Dylan Scheumann and Jack Speedy
 */

/** namespace. */
var rhit = rhit || {};

rhit.FB_COLLECTION_HALLWAYS = "Hallways";
rhit.FB_COLLECTION_JUDY = "Judy";
rhit.FB_COLLECTION_DISH_CREW = "Dish Crew";
rhit.FB_COLLECTION_LIBRARY = "Library";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.fbDutiesManager = null;
rhit.fbSingleDutyManager = null;

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

rhit.Duty = class {
	constructor(id, title, description) {
		this.id = id;
		this.title = title;
		this.description = description;
	}
}

rhit.FbDutiesManager = class {
	constructor(location) {
		this._documentSnapshots = [];
		if (location == "hallways") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_HALLWAYS);
		} else if (location == "judy") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_JUDY);
		} else if (location == "library") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_LIBRARY);
		} else if (location == "dishCrew") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_DISH_CREW);
		}
		this._unsubscribe = null;
	}
	add(title, description) {
		// Add a new document with a generated id.
		this._ref.add({
				[rhit.FB_KEY_TITLE]: title,
				[rhit.FB_KEY_DESCRIPTION]: description,
			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_TITLE, "desc").limit(50);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Duty update");
			this._documentSnapshots = querySnapshot.docs;
			// querySnapshot.forEach((doc) => {
			// 	console.log(doc.data());
			// });
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	// update(id, quote, movie) {}
	// delete(id) {}
	get length() {
		return this._documentSnapshots.length;
	}
	getDutyAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const d = new rhit.Duty(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_TITLE),
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
		);
		return d;
	}
}

rhit.FbSingleDutyManager = class {

	constructor(dutyId, location) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		if (location == "hallways") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_HALLWAYS).doc(dutyId);
		} else if (location == "judy") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_JUDY).doc(dutyId);
		} else if (location == "library") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_LIBRARY).doc(dutyId);
		} else if (location == "dishCrew") {
			this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_DISH_CREW).doc(dutyId);
		}
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(title, description) {
		this._ref.update({
				[rhit.FB_KEY_TITLE]: title,
				[rhit.FB_KEY_DESCRIPTION]: description,
			})
			.then(() => {
				console.log("Document successfully updated!");
			})
			.catch(function (error) {
				console.error("Error updating document: ", error);
			});
	}

	delete() {
		return this._ref.delete();
	}

	get title() {
		return this._documentSnapshot.get(rhit.FB_KEY_TITLE);
	}

	get description() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
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
			document.querySelector("#submitInputPass").addEventListener("click", (event) => {
				const inputPass = document.querySelector("#inputPass").value;
				if (inputPass == "1865") {
					rhit.isHouseManager = true;
				}
				if (rhit.isHouseManager == true) {
					window.location.href = "/manager.html";
				} else {
					window.location.href = "/start.html";
				}
			});
		});

		$("#enterPass").on("show.bs.modal", (event) => {
			//Pre animation
			document.querySelector("#inputPass").value = "";
		});
		$("#enterPass").on("shown.bs.modal", (event) => {
			//Post animation
			document.querySelector("#inputPass").focus();
		});
	}
}

rhit.PerformersPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#dishCrewButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/dishCrew.html?isHouseManager=false`;
		});
		document.querySelector("#judyButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/judy.html?isHouseManager=false`;
		});
		document.querySelector("#libraryButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/library.html?isHouseManager=false`;
		});
		document.querySelector("#lowerNorthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=lowerNorth&isHouseManager=false`;
		});
		document.querySelector("#lowerSouthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=lowerSouth&isHouseManager=false`;
		});
		document.querySelector("#upperNorthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=upperNorth&isHouseManager=false`;
		});
		document.querySelector("#upperSouthButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallways.html?area=upperSouth&isHouseManager=false`;
		});
	}
}

rhit.ManagerPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#dishCrewButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/dishCrewManage.html?isHouseManager=true`;
		});
		document.querySelector("#judyButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/judyManage.html?isHouseManager=true`;
		});
		document.querySelector("#libraryButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/libraryManage.html?isHouseManager=true`;
		});
		document.querySelector("#hallwaysButton").addEventListener("click", (event) => {
			//TODO: have button to say "im finished", use area to send notif to manager for that area being completed
			window.location.href = `/hallwaysManage.html?isHouseManager=true`;
		});
	}
}

rhit.HallwaysPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		if (rhit.isHouseManager) {
			document.querySelector("#submitAddDuty").addEventListener("click", (event) => {
				const title = document.querySelector("#inputTitle").value;
				const description = document.querySelector("#inputDescription").value;
				rhit.fbHallwayDutiesManager.add(title, description);
			});

			$("#addDutyDialog").on("show.bs.modal", (event) => {
				//Pre animation
				document.querySelector("#inputTitle").value = "";
				document.querySelector("#inputDescription").value = "";
			});
			$("#addDutyDialog").on("shown.bs.modal", (event) => {
				//Post animation
				document.querySelector("#inputTitle").focus();
			});
		}

		rhit.fbHallwayDutiesManager.beginListening(this.updateList.bind(this));
	}
	updateList() {
		const newList = htmlToElement('<div id="hallwaysDutiesListContainer"></div>');

		for (let i = 0; i < rhit.fbHallwayDutiesManager.length; i++) {
			const d = rhit.fbHallwayDutiesManager.getDutyAtIndex(i);
			const newCard = this._createCard(d);
			newCard.onclick = (event) => {
				console.log(rhit.isHouseManager);
				if (rhit.isHouseManager == true) {
					window.location.href = `/duty.html?id=${d.id}&duties=hallways`;
				}
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#hallwaysDutiesListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(duty) {
		return htmlToElement(`<div class="card">
	    <div class="card-body">
	      <h5 class="card-title">${duty.title}</h5>
	      <h6 class="card-subtitle mb-2 text-muted">${duty.description}</h6>
	    </div>
	  </div>`)
	}
}

rhit.DishCrewPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		if (rhit.isHouseManager) {
			document.querySelector("#submitAddDuty").addEventListener("click", (event) => {
				const title = document.querySelector("#inputTitle").value;
				const description = document.querySelector("#inputDescription").value;
				rhit.fbDishCrewDutiesManager.add(title, description);
			});

			$("#addDutyDialog").on("show.bs.modal", (event) => {
				//Pre animation
				document.querySelector("#inputTitle").value = "";
				document.querySelector("#inputDescription").value = "";
			});
			$("#addDutyDialog").on("shown.bs.modal", (event) => {
				//Post animation
				document.querySelector("#inputTitle").focus();
			});
		}

		rhit.fbDishCrewDutiesManager.beginListening(this.updateList.bind(this));
	}
	updateList() {
		const newList = htmlToElement('<div id="dishCrewDutiesListContainer"></div>');

		for (let i = 0; i < rhit.fbDishCrewDutiesManager.length; i++) {
			const d = rhit.fbDishCrewDutiesManager.getDutyAtIndex(i);
			const newCard = this._createCard(d);
			newCard.onclick = (event) => {
				if (rhit.isHouseManager == true) {
					window.location.href = `/duty.html?id=${d.id}&duties=dishCrew`;
				}
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#dishCrewDutiesListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(duty) {
		return htmlToElement(`<div class="card">
	    <div class="card-body">
	      <h5 class="card-title">${duty.title}</h5>
	      <h6 class="card-subtitle mb-2 text-muted">${duty.description}</h6>
	    </div>
	  </div>`)
	}
}

rhit.LibraryPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		if (rhit.isHouseManager) {
			document.querySelector("#submitAddDuty").addEventListener("click", (event) => {
				const title = document.querySelector("#inputTitle").value;
				const description = document.querySelector("#inputDescription").value;
				rhit.fbLibraryDutiesManager.add(title, description);
			});

			$("#addDutyDialog").on("show.bs.modal", (event) => {
				//Pre animation
				document.querySelector("#inputTitle").value = "";
				document.querySelector("#inputDescription").value = "";
			});
			$("#addDutyDialog").on("shown.bs.modal", (event) => {
				//Post animation
				document.querySelector("#inputTitle").focus();
			});
		}

		rhit.fbLibraryDutiesManager.beginListening(this.updateList.bind(this));
	}
	updateList() {
		const newList = htmlToElement('<div id="libraryDutiesListContainer"></div>');

		for (let i = 0; i < rhit.fbLibraryDutiesManager.length; i++) {
			const d = rhit.fbLibraryDutiesManager.getDutyAtIndex(i);
			const newCard = this._createCard(d);
			newCard.onclick = (event) => {
				if (rhit.isHouseManager == true) {
					window.location.href = `/duty.html?id=${d.id}&duties=library`;
				}
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#libraryDutiesListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(duty) {
		return htmlToElement(`<div class="card">
	    <div class="card-body">
	      <h5 class="card-title">${duty.title}</h5>
	      <h6 class="card-subtitle mb-2 text-muted">${duty.description}</h6>
	    </div>
	  </div>`)
	}
}

rhit.JudyPageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		if (rhit.isHouseManager) {
			document.querySelector("#submitAddDuty").addEventListener("click", (event) => {
				const title = document.querySelector("#inputTitle").value;
				const description = document.querySelector("#inputDescription").value;
				rhit.fbJudyDutiesManager.add(title, description);
			});

			$("#addDutyDialog").on("show.bs.modal", (event) => {
				//Pre animation
				document.querySelector("#inputTitle").value = "";
				document.querySelector("#inputDescription").value = "";
			});
			$("#addDutyDialog").on("shown.bs.modal", (event) => {
				//Post animation
				document.querySelector("#inputTitle").focus();
			});
		}

		rhit.fbJudyDutiesManager.beginListening(this.updateList.bind(this));
	}
	updateList() {
		const newList = htmlToElement('<div id="judyDutiesListContainer"></div>');

		for (let i = 0; i < rhit.fbJudyDutiesManager.length; i++) {
			const d = rhit.fbJudyDutiesManager.getDutyAtIndex(i);
			const newCard = this._createCard(d);
			newCard.onclick = (event) => {
				if (rhit.isHouseManager == true) {
					window.location.href = `/duty.html?id=${d.id}&duties=judy`;
				}
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#judyDutiesListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(duty) {
		return htmlToElement(`<div class="card">
	    <div class="card-body">
	      <h5 class="card-title">${duty.title}</h5>
	      <h6 class="card-subtitle mb-2 text-muted">${duty.description}</h6>
	    </div>
	  </div>`)
	}
}

rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitEditDuty").addEventListener("click", (event) => {
			const quote = document.querySelector("#inputTitle").value;
			const movie = document.querySelector("#inputDescription").value;
			rhit.fbSingleDutyManager.update(quote, movie);
		});

		$("#editDutyDialog").on("show.bs.modal", (event) => {
			//Pre animation
			document.querySelector("#inputTitle").value = rhit.fbSingleDutyManager.title;
			document.querySelector("#inputDescription").value = rhit.fbSingleDutyManager.description;
		});
		$("#editDutyDialog").on("shown.bs.modal", (event) => {
			//Post animation
			document.querySelector("#inputTitle").focus();
		});

		document.querySelector("#submitDeleteDuty").addEventListener("click", (event) => {
			rhit.fbSingleDutyManager.delete().then(function () {
				console.log("Document successfully deleted!");
				window.location.href = history.back().back();
			}).catch(function (error) {
				console.error("Error removing document: ", error);
			});
		});
		rhit.fbSingleDutyManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		document.querySelector("#cardTitle").innerHTML = rhit.fbSingleDutyManager.title;
		document.querySelector("#cardDescription").innerHTML = rhit.fbSingleDutyManager.description;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	const isHouseManager = urlParams.get("isHouseManager");
	if(isHouseManager == "true"){
		rhit.isHouseManager = true;
	} else {
		rhit.isHouseManager = false;
	}
	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}
	if (document.querySelector("#startPage")) {
		new rhit.StartPageController();
	}
	if (document.querySelector("#performersPage")) {
		new rhit.PerformersPageController();
	}
	if (document.querySelector("#managerPage")) {
		new rhit.ManagerPageController();
	}
	if (document.querySelector("#hallwaysPage") || document.querySelector("#hallwaysManagePage")) {
		rhit.fbHallwayDutiesManager = new rhit.FbDutiesManager("hallways");
		new rhit.HallwaysPageController();
	}
	if (document.querySelector("#judyPage") || document.querySelector("#judyManagePage")) {
		rhit.fbJudyDutiesManager = new rhit.FbDutiesManager("judy");
		new rhit.JudyPageController();
	}
	if (document.querySelector("#libraryPage") || document.querySelector("#libraryManagePage")) {
		rhit.fbLibraryDutiesManager = new rhit.FbDutiesManager("library");
		new rhit.LibraryPageController();
	}
	if (document.querySelector("#dishCrewPage") || document.querySelector("#dishCrewManagePage")) {
		rhit.fbDishCrewDutiesManager = new rhit.FbDutiesManager("dishCrew");
		new rhit.DishCrewPageController();
	}
	if (document.querySelector("#detailPage")) {
		const dutyId = urlParams.get("id");
		const location = urlParams.get("duties");
		if (!dutyId) {
			window.location.href = "/";
		}
		rhit.fbSingleDutyManager = new rhit.FbSingleDutyManager(dutyId, location);
		new rhit.DetailPageController();
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