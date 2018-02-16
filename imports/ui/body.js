import { Template } from 'meteor/templating';
import './body.html';

// TODO
//populate the drop down menus for the form (locations,index,threshhold)
//  where are these values stored? there will obviously be only a limited number of areas available

////////////////////////////////////////////
// FUNCTIONS RELATED TO THE ENTIRE PAGE
////////////////////////////////////////////

//instantiate sortable tables
$(function(){
  $("#openProtections").tablesorter();
});

$(function(){
  $("#myProtections").tablesorter();
});

Template.sortableRows.helpers({
  isEqual: function (a, b) {
  return a === b;
  }
});

//instantiate tab layout
ReactiveTabs.createInterface({
  template: 'basicTabs',
  onChange: function (slug, template) {
    // This callback runs every time a tab changes.
    // The `template` instance is unique per {{#basicTabs}} block.
    console.log('[tabs] Tab has changed! Current tab:', slug);
    console.log('[tabs] Template instance calling onChange:', template);
  }
});

Template.navigation.helpers({
  tabs: function () {
    // Every tab object MUST have a name and a slug!
    return [
      { name: 'Open Protections', slug: 'open' },
      { name: 'Create a Protection', slug: 'create' },
      { name: 'My Protections', slug: 'mine', onRender: function(slug, template) {
        // Make the call to block chain to get information on protections
      }}
    ];
  },
  activeTab: function () {
    // Use this optional helper to reactively set the active tab.
    // All you have to do is return the slug of the tab.

    // You can set this using an Iron Router param if you want--
    // or a Session variable, or any reactive value from anywhere.

    // If you don't provide an active tab, the first one is selected by default.
    // See the `advanced use` section below to learn about dynamic tabs.
    return Session.get('activeTab'); // Returns "people", "places", or "things".
  }
});

////////////////////////////////////////////
// FUNCTIONS RELATED TO "OPEN PROTECTIONS"
////////////////////////////////////////////

//tables should display as loading until data is available
$('table,#mask').addClass('loading');

// populate open protections table
Template.openProtectionsTable.helpers({
  headerData: function() {
    return [
      {
        type: "headerRow"
        ,column: [
          {name:"Token Hash"}
          ,{name:"Term"}
          ,{name:"Payout"}
          ,{name:"Cost"}
          ,{name:"Location"}
          ,{name:"Index"}
          ,{name:"Threshold"}
          ,{name:"Buy/Fund"}
        ]
      }
    ];
  },
  bodyData: function(){
    //this will be a function that makes a call and communicates with the ethereum
    // var data = setTimeout(function(){
    //   $('.wrapper').removeClass('loading');
      return [
        {
          type: "bodyRow"
          ,column: [
            {name:"#123456789"}
            ,{name:"2 mo"}
            ,{name:"2$"}
            ,{name:"5$"}
            ,{name:"US corn belt"}
            ,{name:"Index"}
            ,{name:"10%"}
            ,{name:"Buy"}
          ]
        },
        {
          type: "bodyRow"
          ,column: [
            {name:"#285937365"}
            ,{name:"5 mo"}
            ,{name:"6$"}
            ,{name:"2$"}
            ,{name:"US corn belt"}
            ,{name:"Index"}
            ,{name:"10%"}
            ,{name:"Fund"}
          ]
        }
      ];
    // }, 1000);
    // return data;
  }
});

////////////////////////////////////////////
// FUNCTIONS RELATED TO "CREATE A PROTECTION"
////////////////////////////////////////////

// populate new protections form with table
Template.formNewProtection.helpers({
  formNewProtection: function() {
    return [
      {
        title: "Start Date:"
        ,tooltiptext: "The starting date of the contract."
        ,type: "date"
        ,name: "start-date"
        ,id: "start-date"
      }
      ,{
        title: "End Date:"
        ,tooltiptext: "The ending date of the contract."
        ,type: "date"
        ,name: "end-date"
        ,id: "end-date"
      }
      ,{
        title: "ETH Payout:"
        ,tooltiptext: "The amount of ETH received by the contract buyer if the ___ are met."
        ,type: "number"
        ,name: "payout"
      }
      ,{
        title: "ETH Cost:"
        ,tooltiptext: "The amount of ETH received by the contract seller if the ___ are met."
        ,type: "number"
        ,name: "cost"
      }
      ,{
        title: "Location:"
        ,tooltiptext: "The geographic area covered by the contract."
        ,type: "select"
        ,name: "location"
        ,article: "a"
        ,elOptions:[
          ,{
            value: "us-corn-belt"
            ,text: "US Corn Belt"
          }
        ]
      }
      ,{
        title: "Index:"
        ,tooltiptext: "The ____."
        ,type: "select"
        ,name: "index"
        ,article: "an"
        ,elOptions:[
          ,{
            value: "rainfall"
            ,text: "Rainfall"
          }
        ]
      }
      ,{
        title: "Threshold:"
        ,tooltiptext: "The amount of deviation required to trigger the outcome of the contract."
        ,type: "select"
        ,name: "threshold"
        ,article: "a"
        ,elOptions:[
          ,{
            value: "10pct"
            ,text: "10% less than average"
          }
        ]
      }
      ,{
        title: "Buy or Sell:"
        ,tooltiptext: "Are you offering to sell this contract or are you looking to buy this contract?"
        ,type: "toggle"
      }
    ];
  }
});

Template.elNewProtection.helpers({
  minDate: function() {
    return new Date().toISOString().substring(0,10);
  },
  isEqual: function (a, b) {
    return a === b;
  }
});

// Dealing with submittal of form
Template.formNewProtection.events({
  'input .date-picker'(event) {
    var target = event.currentTarget;
    capDate(target);
    console.log("input")
  },
  'submit .new-protection'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.currentTarget;
    const startDate = target[0].value;
    const endDate = target[1].value;
    const payout = target[2].value;
    const cost = target[3].value;
    const location = target[4].value;
    const index = target[5].value;
    const threshold = target[6].value;
    const buySell = target[7].checked ? "Buy" : "Sell";

    //check if info is missing
    if(startDate === "" || endDate === "" || parseFloat(payout) === 0 || parseFloat(cost) === 0 || location === "" || index === "" || threshold === ""){
      var s = "Please complete form: \n";
      if(startDate === "") s += "  Start Date \n";
      if(endDate === "") s += "  End Date \n";
      if(parseFloat(payout) === 0) s += "  Payout Date \n";
      if(parseFloat(cost) === 0) s += "  Cost Date \n";
      if(location === "") s += "  Location Date \n";
      if(index === "") s += "  Index Date \n";
      if(threshold === "") s += "  Threshold Date \n";
      alert(s);
    }else{
      //ask for confirmation
      const confirmed = confirm ( "Please confirm your selection: \n\n"
        + "  Start Date: " + startDate + "\n"
        + "  End Date: " + endDate + "\n"
        + "  ETH Payout: " + payout + "\n"
        + "  ETH Cost: " + cost + "\n"
        + "  Location: " + location + "\n"
        + "  Index: " + index + "\n"
        + "  Threshold: " + threshold + "\n"
        + "  Buy or Sell: " + buySell + "\n"
      );

      if(confirmed){
        //submit info
        //clear form
        target[0].value = "";
        target[1].value = "";
        target[2].value = 0;
        target[3].value = 0;
        target[4].value = "";
        target[5].value = "";
        target[6].value = "";
        target[7].value = "";
      }else{
        //let user continue to edit
      }
    }
  },
});

function capDate(target){
  //change properties of the other date picker so that incorrect values can't be chosen
  var date = target.value;
  var id = target.id;
  var now = new Date().toISOString().substring(0,10);

  //if start is changed first, then put min on end Date
  if(id === 'start-date'){
    if(date !== "") if(new Date(now) - new Date(date) <= 0) $('#end-date')[0].min = date;
  }
  if(id === 'end-date'){
    if(date !== "") $('#start-date')[0].max = date;
  }
}

////////////////////////////////////////////
// FUNCTIONS RELATED TO "MY PROTECTIONS"
////////////////////////////////////////////

// populate open protections table
Template.myProtectionsTable.helpers({
  headerData: function() {
    return [
      {
        type: "headerRow"
        ,column: [
          {name:"Seller"}
          ,{name:"Buyer"}
          ,{name:"Start"}
          ,{name:"End"}
          ,{name:"Payout"}
          ,{name:"Cost"}
          ,{name:"Location"}
          ,{name:"Index"}
          ,{name:"Threshold"}
          ,{name:"Status"}
          ,{name:"Action"}
        ]
      }
    ];
  },
  bodyData: function(){
    //this will be a function that makes a call and communicates with the ethereum
    return [
      {
        type: "bodyRow"
        ,column: [
          {name:"#325927593"}
          ,{name:"#56425673"}
          ,{name:"01-02-2018"}
          ,{name:"03-04-2018"}
          ,{name:"7$"}
          ,{name:"8$"}
          ,{name:"Alberta"}
          ,{name:"index"}
          ,{name:"10%"}
          ,{name:"frozen"}
          ,{name:"action"}
        ]
      },
      {
        type: "bodyRow"
        ,column: [
          {name:"#539503827"}
          ,{name:"#56425673"}
          ,{name:"07-02-2018"}
          ,{name:"09-09-2018"}
          ,{name:"1$"}
          ,{name:"10$"}
          ,{name:"Saskatchewan"}
          ,{name:"index"}
          ,{name:"10%"}
          ,{name:"evaluating"}
          ,{name:"action"}
        ]
      }
    ];  }
});
