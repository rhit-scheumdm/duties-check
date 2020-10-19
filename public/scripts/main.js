var rhit = rhit || {};

rhit.logInCheck = class {
	constructor() {
		document.querySelector("#logInButton").addEventListener("click", (event) => {
			const email = document.querySelector("#inputEmail").value;
			const password = document.querySelector("#inputPassword").value;
			console.log('email :>> ', email);
			console.log('password :>> ', password);
			firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
				window.location.href = "/duties.html";
			})
			.catch(function(error) {
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("Existing account log in error", errorCode, errorMessage);
			});
		});
	}

}

rhit.DutiesPage = class {
	constructor() {
		console.log('document.querySelector("#signOutButton") :>> ', document.querySelector("#signOutButton"));
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
	if(document.querySelector("#dutiesPage")) {
		new rhit.DutiesPage();
	}
};

rhit.main();
