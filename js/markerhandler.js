var uid = null;
AFRAME.registerComponent("markerhandler", {
  init: async function() {
    var toys = await this.getToys();

    if (uid === null) {
      this.askUserId();
    }

    this.el.addEventListener("markerFound", () => {
      if (uid !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);
      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askUserId: function() {
    var iconUrl =
      "https://raw.githubusercontent.com/whitehatjr/ar-toy-store-assets/master/toy-shop.png";

    swal({
      title: "Welcome to Toy Shop!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your uid Ex:( U01 )"
        }
      }
    }).then(inputValue => {
      uid = inputValue;
    });
  },
  handleMarkerFound: function(toys, markerId) {
    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.is_out_of_stock) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is out of stock!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      // Changing Model scale to initial scale
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      // make model visible
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("visible", true);

      // make description Container visible
      var mainPlane = document.querySelector(`#main-plane-${toy.id}`);
      mainPlane.setAttribute("visible", true);

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");
      // Handling Click Events
      orderButtton.addEventListener("click", () => {
        uid = uid.toUpperCase();
        this.handleOrder(uid, toy);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "  ",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

      payButton.addEventListener("click", () => this.handlePayment());
    }
  },
  handleOrder: function(uid, toy) {
    // Reading current UID order details
    firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][toy.id]) {
          // Increasing Current Quantity
          details["current_orders"][toy.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1
          };
        }

        details.total_bill += toy.price;

        // Updating Db
        firebase
          .firestore()
          .collection("users")
          .doc(doc.id)
          .update(details);
      });
  },
  getToys: async function() {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  getorderSummary: async function(uid) {
   


  },
  handleOrderSummary: async function() {
    // Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";
    // Getting UID
    uid = uid.toUpperCase();

    // Getting Order summary from database
    var orderSummary = await this.getorderSummary(uid);

    var tableBodyTag = document.getElementById("bill-table-body");
    // Removing old tr data
    tableBodyTag.innerHTML = "";

    var currentOrders = Object.keys(orderSummary.current_orders);
    currentOrders.map(i => {
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;
      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);
      tableBodyTag.appendChild(tr);
    });

 //create the row for total amount
  },
  handlePayment: function() {
    // Close Modal
    document.getElementById("modal-div").style.display = "none";

    // Getting UID
    uid = uid.toUpperCase();

    // Reseting current orders and total bill
    firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "Thank You For Paying",
          text: "We Hope You Enjoy Our Toys!",
          timer: 2500,
          buttons: false
        });
        //add the swal to show thanks for payment
      });
  },
  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
