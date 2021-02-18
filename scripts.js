document.addEventListener("DOMContentLoaded", function () {
    console.log("Loaded!");

    const db = firebase.firestore();

    const uploadBtn = document.getElementById("uploadBtn");
    const submit = document.getElementById("submit");
    const imageName = document.getElementById("imageName");
    const progress = document.getElementById("progress");
    const gallery = document.getElementById("gallery");
    const catImg = document.getElementById("catImg");
    const dogImg = document.getElementById("dogImg");

    let file = "";
    let fileName = "";
    let fileExt = "";

    uploadBtn.addEventListener("change", function (e) {
        file = e.target.files[0];
        fileName = file.name.split(".").shift();
        fileExt = file.name.split(".").pop();
        imageName.value = fileName;
        console.log({ file, fileName, fileExt });
    });

    submit.addEventListener("click", function () {
        if (imageName.value) {
            const id = db.collection("Images").doc().id;
            const storageRef = firebase.storage().ref(`images/${id}.${fileExt}`);

            const uploadTask = storageRef.put(file);

            uploadTask.on(
                "state_changed",
                function (snapshot) {
                    progress.value =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                },
                function (error) {
                    console.log(error);
                },
                function () {
                    uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                        db.collection("Images")
                            .doc(id)
                            .set({
                                name: imageName.value,
                                id: id,
                                image: downloadURL,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            })
                            .then(function () {
                                file = "";
                                fileName = "";
                                fileExt = "";
                                imageName.value = "";
                                progress.value = 0;

                                createGallery();
                            });
                    });
                }
            );
        }
    });

    function createGallery() {
        gallery.innerHTML = "";
        const listRef = firebase.storage().ref("images");

        listRef
            .listAll()
            .then(function (res) {
                res.items.forEach(function (itemRef) {
                    itemRef
                        .getDownloadURL()
                        .then(function (downloadURL) {
                            const imgWrapper = document.createElement("div");
                            imgWrapper.className = "img_wrapper";

                            const img = document.createElement("img");
                            img.src = downloadURL;

                            const deleteBtn = document.createElement("button");
                            deleteBtn.innerHTML = "x";

                            deleteBtn.addEventListener("click", function () {
                                itemRef
                                    .delete()
                                    .then(function () {
                                        db.collection("Images")
                                            .doc(itemRef.name.split(".").shift())
                                            .delete()
                                            .then(function () {
                                                console.log("file deleted!");
                                                createGallery();
                                            })
                                            .catch((error) =>
                                                console.log("error deleting the file", error)
                                            );
                                    })
                                    .catch((error) => console.log("error", error));
                            });

                            imgWrapper.append(img);
                            imgWrapper.append(deleteBtn);
                            gallery.append(imgWrapper);
                        })
                        .catch((error) => console.log("error", error));
                });
            })
            .catch((error) => console.log("error", error));
    }

    createGallery();

    db.collection("Images")
        .orderBy("timestamp", "asc")
        .onSnapshot(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                console.log("doc", doc.data());
                if (doc.data().name.includes("cat")) {
                    catImg.src = doc.data().image;
                }
                if (doc.data().name.includes("dog")) {
                    dogImg.src = doc.data().image;
                }
            });
        });
});