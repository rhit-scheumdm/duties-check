var rhit = rhit || {};

rhit.logInCheck = class {
	constructor() {
		document.querySelector("#logInButton").addEventListener("click", (event) => {
			const email = document.querySelector("#inputEmail").value;
			const password = document.querySelector("#inputPassword").value;
			console.log('email :>> ', email);
			console.log('password :>> ', password);
			firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
				window.location.href = "/startPage.html";
			})
			.catch(function(error) {
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("Existing account log in error", errorCode, errorMessage);
			});
		});
	}

}

rhit.StartPage = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			window.location.href = "/";
		});
	}
}

rhit.main = function () {
	console.log("Ready");
	if(document.querySelector("#mainPage")) {
		new rhit.logInCheck();
	}
	if(document.querySelector("#startPage")) {
		new rhit.StartPage();
	}
};

rhit.main();
