import { Template } from 'meteor/templating';
import './body.html';

////////////////////////////////////////////
// FUNCTIONS RELATED TO WEB3 PAGE STARTUP
////////////////////////////////////////////

//used for asynchronous web3 calls
const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    );

//table entry constructor open protections
function Entry(r){
  let a = r.args;
  let l = r.transactionHash.length;
  let s = r.transactionHash.substring(0,8) + "..." + r.transactionHash.substring(l-8,l)
  let d1 = new Date(a.start.c[0]).toISOString().substring(0,10);
  let d2 = new Date(a.end.c[0]).toISOString().substring(0,10);
  let ask = a.weiAsking.c[0]
  let propose = a.weiContributing.c[0]

  //update for if the contract is for offered for sale or for funding
  let b, b1;
  let sellerContr, buyerContr;
  if(propose < ask){
    b = "Sell";
    b1 = "<button type='button' class='sellit'> sell </button>";
    sellerContr = ask;
    buyerContr = propose;
  }
  if(ask < propose){
    b = "Buy";
    b1 = "<button type='button' class='buyit'> buy </button>";
    sellerContr = propose;
    buyerContr = ask;
  }

  //create the object
  this.id = a.tokenID;
  this.type = "bodyRow";
  this.column = [
       {type:"num",name:r.blockNumber}
      ,{type:"text",name:s}
      ,{type:"text",name:d1}
      ,{type:"text",name:d2}
      ,{type:"num",name:buyerContr}
      ,{type:"num",name:sellerContr}
      ,{type:"text",name:a.location}
      ,{type:"text",name:a.index}
      ,{type:"num",name:a.threshold}
      ,{type:"button",name:b,button:b1}
    ];
}
//table entry constructor my protections
function MyEntry(r,a,bool){
  let l = r.transactionHash.length;
  let s = r.transactionHash.substring(0,8) + "..." + r.transactionHash.substring(l-8,l)
  let d1 = new Date(a.start.c[0]).toISOString().substring(0,10);
  let d2 = new Date(a.end.c[0]).toISOString().substring(0,10);
  let ask = a.weiAsking.c[0]
  let propose = a.weiContributing.c[0]

  //update for if the contract is for offered for sale or for funding
  let b = "Buy";
  let b1 = "<button type='button' class='action'> action </button>";

  let sellerContr, buyerContr;
  if(propose < ask){
    sellerContr = ask;
    buyerContr = propose;
  }
  if(ask < propose){
    sellerContr = propose;
    buyerContr = ask;
  }

  let o;
  if(bool){
    if(propose < ask) o = "you are the <strong>buyer</strong>";
    if(ask < propose) o = "you are the <strong>seller</strong>";
  }else{
    if(propose < ask) o = "you are the <strong>seller</strong>";
    if(ask < propose) o = "you are the <strong>buyer</strong>";
  }

  //create the object
  this.type = "bodyRow";
  this.column = [
       {type:"num",name:r.blockNumber}
      ,{type:"text",name:s}
      ,{type:"text",name:o}
      ,{type:"text",name:d1}
      ,{type:"text",name:d2}
      ,{type:"num",name:buyerContr}
      ,{type:"num",name:sellerContr}
      ,{type:"text",name:a.location}
      ,{type:"text",name:a.index}
      ,{type:"num",name:a.threshold}
      ,{type:"text",name:"open"}
      ,{type:"button",name:b,button:b1}
    ];
}

const witAddress  = "0xf25186b5081ff5ce73482ad761db0eb0d25abfbf";
const cropAddress = "0x345ca3e014aaf5dca488057592ee47305d9b3e10";
const testUser    = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
const testUser2   = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";

var user;
var cropContract;
var cropInstance;
var witContract;
var witInstance;

var lastBlock;
var lastBlock2;
var lastBlock3;

if (Meteor.isClient) {
  Meteor.startup(async function() {
    console.log('Meteor.startup');
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      console.log("web3 from current provider: ",web3.currentProvider.constructor.name)
      // Use Mist/MetaMask's provider
      web3js = new Web3(web3.currentProvider);
      //show relevant content depending on wether web3 is loaded or not
      $('#web3-waiting').hide();
      $('#web3-onload').show();
      //initialize web3 contracts
      Session.set("activeUser","current user: no current user- log into metamask");
      try{
        user = await promisify(cb => web3.eth.getAccounts(cb));
        let s;
        if(user[0]) s = "current user: " + user[0];
        Session.set("activeUser",s);
      } catch (error) {
        console.log(error)
        alert("User information was not loaded succesfully: " + error.message);
      }

      //TODO check for subsequent account activity, lockout screen if no metamask user is signed in
      // setInterval(async function(){
      //   try{
      //     user = await promisify(cb => web3.eth.getAccounts(cb));
      //     let s;
      //     if(user[0]) s = "current user: " + user[0];
      //     else s = "current user: no current user- log into metamask";
      //     Session.set("activeUser",s);
      //   } catch (error) {
      //     console.log(error)
      //     alert("User information was not loaded succesfully: " + error.message);
      //   }
      // }, 5000);

      //check for network use correct deployed addresses
      web3.version.getNetwork((err, netId) => {
        switch (netId) {
          case "1":
            console.log('This is mainnet')
            break
          case "2":
            console.log('This is the deprecated Morden test network.')
            break
          case "3":
            console.log('This is the ropsten test network.')
            break
          case "4":
            console.log('This is the Rinkeby test network.')
            break
          case "42":
            console.log('This is the Kovan test network.')
            break
          default:
            console.log('This is an unknown network.')
        }
      })

      cropContract = web3.eth.contract(CROPABI);
      cropInstance = cropContract.at(cropAddress);
      witContract = web3js.eth.contract(WITABI);
      witInstance = witContract.at(witAddress);
      console.log(WITABI)

      //add new entries as they are created, only call once total list is populated
      witInstance.ProposalOffered(Session.get("filterCriteria"),{fromBlock: 0, toBlock: 'latest'}).watch(function(error, result){
        if(result.blockNumber !== lastBlock){
          $('.loader').hide();
          $('.wrapper').removeClass('loading');
          let list = Session.get("openProtectionsFilteredData");
          console.log("===> new proposal created",result)
          list.push(new Entry(result));
          lastBlock = result.blockNumber; //this is a hacky workaround, why is event being called more than once?
          Session.set("openProtectionsFilteredData",list);
        }
      });
      //add new entries as they are created, only call once total list is populated
      witInstance.ProposalOffered({},{fromBlock: 0, toBlock: 'latest'}).watch(async function(error, result){
        try{
          let id = result.args.tokenID;
          let owner = await promisify(cb => witInstance.ownerOf(id, cb));
          if(result.blockNumber !== lastBlock2 && owner === user[0]){
            let list = Session.get("myProtectionsFilteredData");
            list.push(new MyEntry(result,result.args,true));
            lastBlock2 = result.blockNumber; //this is a hacky workaround, why is event being called more than once?
            Session.set("myProtectionsFilteredData",list);
          }
        } catch (error) {
          console.log(error)
          alert("My Protections data failed to load: " + error.message);
        }
      });
      //do something as new proposal is accepted
      witInstance.ProposalAccepted({},{fromBlock: 0, toBlock: 'latest'}).watch(async function(error, result){
        try{
          let outerResult = result;
          let id = result.args.tokenIDAccepter;
          let idp = result.args.tokenIDProposer;
          let owner = await promisify(cb => witInstance.ownerOf(id, cb));
          if(result.blockNumber !== lastBlock3 && owner === user[0]){
            //get contract information for associated proposal
            witInstance.ProposalOffered({tokenID:idp},{fromBlock: 0, toBlock: 'latest'}).watch(function(error, result){
              console.log("===> proposal accepted",outerResult,result)
              let list = Session.get("myProtectionsFilteredData");
              list.push(new MyEntry(outerResult,result.args,false));
              Session.set("myProtectionsFilteredData",list);
            });
            lastBlock3 = result.blockNumber; //this is a hacky workaround, why is event being called more than once?
            //check the open protections to see if they should be removed
            let list = Session.get("openProtectionsFilteredData");
            var l = list.length;
            while(l--){
              console.log(list[l].id.c[0],idp.c[0])
              if(list[l].id === idp) list.splice(l,1);
            }
            Session.set("openProtectionsFilteredData",list);
          }
        } catch (error) {
          console.log(error)
          alert("My Protections data failed to load: " + error.message);
        }
      });
    } else {
      console.log('No web3? You should consider trying MetaMask!')
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
      //show relevant content depending on wether web3 is available or not
      $('#web3-waiting').hide();
      $('#no-web3').show();
    }
    // Now you can start your app & access web3 freely:
  });

  // Template.body.onCreated(function() {
  //   console.log('Template.body.onCreated');
  // });

  // Template.body.helpers({
  //   currentTemplate: function() {
  //     return Session.get('curTemplate');
  //   },
  // });
}

////////////////////////////////////////////
// ACTIVE USER
////////////////////////////////////////////
Session.set("activeUser","");

// populate open protections table
Template.user.helpers({
  activeUser: function(){
    return [{name: Session.get("activeUser")}];
  }
});

////////////////////////////////////////////
// FUNCTIONS RELATED TO THE TAB LAYOUT
////////////////////////////////////////////

//instantiate tab layout
ReactiveTabs.createInterface({
  template: 'basicTabs',
  onChange: function (slug, template) {
    // This callback runs every time a tab changes.
    // The `template` instance is unique per {{#basicTabs}} block.
    // console.log('[tabs] Tab has changed! Current tab:', slug);
    // console.log('[tabs] Template instance calling onChange:', template);
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
// FUNCTIONS RELATED TO SORTABLE TABLES
////////////////////////////////////////////
Session.set("filterCriteria",{});
Session.set("openProtectionsFilteredData",[]);
Session.set("myProtectionsFilteredData",[]);

Template.sortableRows.helpers({
  isEqual: function (a, b) {
  return a === b;
  }
});

Template.sortableRows.events({
  'click .action': function(e){
    alert("action");
  },
  'click .buyit': function(e){
    acceptProposal("buy");
  },
  'click .sellit': function(e){
    acceptProposal("action");
  }
});

async function acceptProposal(action){
  console.log("fn: acceptProposal")
  let ethAsk = 100;

  try {
    let supply = await promisify(cb => witInstance.totalSupply(cb));
    console.log("supply",supply.toNumber())
    let owner = await promisify(cb => witInstance.ownerOf(supply, cb));
    console.log("owner",user[0],owner)
    let beforeBalance = await promisify(cb => web3.eth.getBalance(witAddress,cb));
    console.log("WIT Balance (beforeBalance): ",beforeBalance.toNumber());
    await promisify(cb => witInstance.createWITAcceptance(supply.toNumber(),{from: testUser, value:ethAsk},cb));
    let supply2 = await promisify(cb => witInstance.totalSupply(cb));
    console.log("supply",supply2.toNumber(),supply.toNumber()+1)
    let afterBalance = await promisify(cb => web3.eth.getBalance(witAddress, cb));
    console.log("afterBalance2",afterBalance.toNumber())
    console.log("afterBalance2-ethAsk === beforeBalance2",afterBalance.toNumber()-ethAsk,beforeBalance.toNumber())
    let owner2 = await promisify(cb => witInstance.ownerOf(supply2.toNumber(), cb));
    console.log("owner",owner2,testUser2)
  } catch (error) {
    console.log(error)
    alert("Transaction was not succesful, a common source of errors is insufficient gas. \n " + error.message);
  }
}

Template.headerRow.onCreated(function(){
  this.descending = new ReactiveVar(false);
});

Template.headerRow.events({
  'mouseenter th': function(e){
    $(e.target).addClass('hover');
  },
  'mouseleave th': function(e){
    $(e.target).removeClass('hover');
  },
  'click th': function(e,template){
    var t = e.target;
    $(t).fadeIn(100).fadeOut(100).fadeIn(100); //.fadeOut(100).fadeIn(100);
    //sort the json based on the header
    let array = [];
    let colIndex = 0;
    let d = template.descending.get();

    if(t.parentElement.parentElement.parentElement.id === "openProtections"){
      array = Session.get("openProtectionsFilteredData");
      //sort array based on the click header
      if(t.innerText === "BLOCK NUMBER") colIndex = 0;
      if(t.innerText === "TOKEN HASH") colIndex = 1;
      if(t.innerText === "START") colIndex = 2;
      if(t.innerText === "END") colIndex = 3;
      if(t.innerText === "BUYER CONTRIBUTION (WEI)") colIndex = 4;
      if(t.innerText === "SELLER CONTRIBUTION (WEI)") colIndex = 5;
      if(t.innerText === "LOCATION") colIndex = 6;
      if(t.innerText === "INDEX") colIndex = 7;
      if(t.innerText === "THRESHOLD (%)") colIndex = 8;
      if(t.innerText === "BUY/FUND") colIndex = 9;
      //set variable to new sorted array
      Session.set("openProtectionsFilteredData",sortArray(array,colIndex,d));
      template.descending.set(!d);
    }
    if(t.parentElement.parentElement.parentElement.id === "myProtections"){
      array = Session.get("myProtectionsFilteredData");
      //sort array based on the click header
      if(t.innerText === "BLOCK NUMBER") colIndex = 0;
      if(t.innerText === "TOKEN HASH") colIndex = 1;
      if(t.innerText === "OWNERSHIP") colIndex = 2;
      if(t.innerText === "START") colIndex = 3;
      if(t.innerText === "END") colIndex = 4;
      if(t.innerText === "BUYER CONTRIBUTION (WEI)") colIndex = 5;
      if(t.innerText === "SELLER CONTRIBUTION (WEI)") colIndex = 6;
      if(t.innerText === "LOCATION") colIndex = 7;
      if(t.innerText === "INDEX") colIndex = 8;
      if(t.innerText === "THRESHOLD (%)") colIndex = 9;
      if(t.innerText === "THRESHOLD (%)") colIndex = 10;
      if(t.innerText === "ACTION") colIndex = 11;
      sortArray(array,colIndex,d);
      //set variable to new sorted array
      Session.set("myProtectionsFilteredData",sortArray(array,colIndex,d));
      template.descending.set(!d);
    }
  }
});

function sortArray(array,i,d){
  let sortedArray = _.sortBy(array,function(obj){
    let cell = obj.column[i], key;
    if(cell.type === "num") return key = parseFloat(cell.name);
    if(cell.type === "text" || cell.type === "button") return key = cell.name;
  });
  if(d) sortedArray.reverse();
  return sortedArray;
}

////////////////////////////////////////////
// FUNCTIONS RELATED TO "OPEN PROTECTIONS"
////////////////////////////////////////////

// input for filter
Template.filter.helpers({
  filterInput: function() {
    return [
      {
        title: "Buyer Contribution (Wei):"
        ,tooltiptext: "The amount of wei contributed by the contract buyer."
        ,type: "number"
        ,name: "buyer"
        ,id: "buyer-filter"
      }
      ,{
        title: "Seller Contribution (Wei):"
        ,tooltiptext: "The amount of wei contributed by the contract seller."
        ,type: "number"
        ,name: "seller"
        ,id: "seller-filter"
      }
    ];
  }
});

Template.elFilter.helpers({
  isEqual: function (a, b) {
    return a === b;
  }
});

// Dealing with submittal of form
Template.filter.events({
  'input .filter'(event) {
    let a = $('#buyer-filter')[0].value;
    let b = $('#seller-filter')[0].value;
    let obj = {};
    if(a > 0) obj.weiAsking = parseInt(a);
    if(b > 0) obj.weiContributing = parseInt(b);
    console.log(obj)
    Session.set("filterCriteria",obj);
    witInstance.ProposalOffered(obj,{fromBlock: 0, toBlock: 'latest'}).get(function(error, result){
      let list = [], l = result.length;
      for(var i = 0; i < l; i++){
        if(result[i].event === "ProposalOffered"){
          console.log("===> new el filtered list",result[i])
          list.push(new Entry(result[i]));
        }
      }
      Session.set("openProtectionsFilteredData",list);
    });
  }
});

// populate open protections table
Template.openProtectionsTable.helpers({
  // filterData: function() {
  //   return [
  //     {
  //       type: "headerRow"
  //       ,column: [
  //         {name:"Token Hash"}
  //         ,{name:"Start"}
  //         ,{name:"End"}
  //         ,{name:"Payout (wei)"}
  //         ,{name:"Cost (wei)"}
  //         ,{name:"Location"}
  //         ,{name:"Index"}
  //         ,{name:"Threshold (%)"}
  //         ,{name:"Buy/Fund"}
  //       ]
  //     }
  //   ];
  // },
  headerData: function() {
    return [
      {
        type: "headerRow"
        ,column: [
          {name:"Block Number"}
          ,{name:"Token Hash"}
          ,{name:"Start"}
          ,{name:"End"}
          ,{name:"Buyer Contribution (wei)"}
          ,{name:"Seller Contribution (wei)"}
          ,{name:"Location"}
          ,{name:"Index"}
          ,{name:"Threshold (%)"}
          ,{name:"Buy/Fund"}
        ]
      }
    ];
  },
  bodyData: function(){
    return Session.get("openProtectionsFilteredData");
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
        title: "Buyer Contribution (Wei):"
        ,tooltiptext: "The amount of wei contributed by the contract buyer."
        ,type: "number"
        ,name: "buyer"
        ,id: "buyer-contrib"
      }
      ,{
        title: "Seller Contribution (Wei):"
        ,tooltiptext: "The amount of wei contributed by the contract seller."
        ,type: "number"
        ,name: "seller"
        ,id: "seller-contrib"
      }
      ,{
        title: "Total Payout (Wei):"
        ,tooltiptext: "The total amount of payout received by one of the parties when the outcome is evaluated."
        ,type: "payout"
        ,id: "payout-amt"
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
          ,{
            value: "india"
            ,text: "India"
          }
          ,{
            value: "canadian-prairies"
            ,text: "Canadian Prairies"
          }
          ,{
            value: "ukraine"
            ,text: "Ukraine"
          }
          ,{
            value: "brazil"
            ,text: "Brazil"
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
            value: "-10"
            ,text: "10% less than average"
          }
          ,{
            value: "-15"
            ,text: "15% less than average"
          }
          ,{
            value: "15"
            ,text: "15% more than average"
          }
        ]
      }
      ,{
        title: " Do you want to buy or sell?"
        ,tooltiptext: "Are you offering to sell this protection or are you looking to buy this protection?"
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
    capDate(event.currentTarget);
  },
  'input .contribution'(event) {
    capVal(event.currentTarget);
  },
  'submit .new-protection'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.currentTarget;
    const startDate = target[0].value;
    const endDate = target[1].value;
    const buyerContr = parseInt(target[2].value);
    const sellerContr = parseInt(target[3].value);
    const location = target[4].value;
    const index = target[5].value;
    const threshold = target[6].value;
    const buySell = target[7].checked ? "Buy" : "Sell";

    //check if info is missing
    if(startDate === "" || endDate === "" || parseFloat(buyerContr) === 0 || parseFloat(sellerContr) === 0 || location === "" || index === "" || threshold === ""){
      var s = "Please complete form: \n";
      if(startDate === "") s += "  Start Date \n";
      if(endDate === "") s += "  End Date \n";
      if(parseFloat(buyerContr) === 0) s += "  Buyer Contribution \n";
      if(parseFloat(sellerContr) === 0) s += "  Seller Contribution \n";
      if(location === "") s += "  Location Date \n";
      if(index === "") s += "  Index Date \n";
      if(threshold === "") s += "  Threshold Date \n";
      alert(s);
    }else{
      //ask for confirmation
      const confirmed = confirm ( "Please confirm your selection: \n\n"
        + "  Start Date: " + startDate + "\n"
        + "  End Date: " + endDate + "\n"
        + "  Buyer Contribution (Wei): " + buyerContr + "\n"
        + "  Seller Contribution (Wei): " + sellerContr + "\n"
        + "  Location: " + location + "\n"
        + "  Index: " + index + "\n"
        + "  Threshold: " + threshold + "\n"
        + "  Buy or Sell: " + buySell + "\n"
      );

      if(confirmed){
        //submit info
        createProposal(startDate,endDate,buyerContr,sellerContr,location,index,threshold,buySell);
      }else{
        //let user continue to edit
      }

      async function createProposal(startDate,endDate,buyerContr,sellerContr,location,index,threshold,buySell){
        const d1 = (new Date(startDate)).getTime();
        const d2 = (new Date(endDate)).getTime();

        let ethPropose = 0;
        let ethAsk = 0;

        if(buySell = "Buy"){
          ethPropose = buyerContr;
          ethAsk = sellerContr;
        }
        if(buySell = "Sell"){
          ethPropose = sellerContr;
          ethAsk = buyerContr;
        }


        try {
          let supplyStart = await promisify(cb => witInstance.totalSupply(cb));
          let beforeBalance = await promisify(cb => web3.eth.getBalance(witAddress, cb));
          let beforeAllowance = await promisify(cb => cropInstance.allowance(user[0],witAddress,cb));
          let approval = await promisify(cb => cropInstance.approve(witAddress,ethPropose + ethAsk,{from: user[0]},cb));
          let afterAllowance = await promisify(cb => cropInstance.allowance(user[0],witAddress,cb));
          await promisify(cb => witInstance.createWITProposal(ethPropose, ethAsk, index, threshold, location, d1, d2, true, {value: ethPropose, from:user[0]}, cb));
          let supply = await promisify(cb => witInstance.totalSupply(cb));
          let afterBalance = await promisify(cb => web3.eth.getBalance(witAddress, cb));

          console.log("before allowance: ",beforeAllowance.toNumber(),0)
          console.log("allowance approved",approval)
          console.log("after allowance: ",afterAllowance.toNumber(),ethPropose + ethAsk)

          console.log("Supply of WIT increased?",supply.toNumber(),supplyStart.toNumber()+1)

          console.log("beforeBalance",beforeBalance.toNumber())
          console.log("afterBalance",afterBalance.toNumber())
          console.log("afterBalance-ethPropose === beforeBalance",afterBalance-ethPropose,beforeBalance.toNumber())

          //clear form if succesful
          target[0].value = "";
          target[1].value = "";
          target[2].value = 0;
          target[3].value = 0;
          target[4].value = "";
          target[5].value = "";
          target[6].value = "";
          target[7].value = "";
          $('#end-date')[0].min = "";
          $('#start-date')[0].max = "";
          $('#seller-contrib')[0].min = 0;
          $('#payout-amt').html(0);
        } catch (error) {
          console.log(error)
          alert("Transaction was not succesful, a common source of errors is insufficient gas. \n " + error.message);
        }
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

function capVal(target){
  //change properties of the other date picker so that incorrect values can't be chosen
  var num = parseInt(target.value);
  var id = target.id;
  if(id === 'buyer-contrib') $('#seller-contrib')[0].min = num + 100;
  //show total payout
  let v = parseInt($('#seller-contrib')[0].value) + parseInt($('#buyer-contrib')[0].value);
  $('#payout-amt').html(v);
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
          {name:"Block Number"}
          ,{name:"Token Hash"}
          ,{name:"Ownership"}
          ,{name:"Start"}
          ,{name:"End"}
          ,{name:"Buyer Contribution (wei)"}
          ,{name:"Seller Contribution (wei)"}
          ,{name:"Location"}
          ,{name:"Index"}
          ,{name:"Threshold (%)"}
          ,{name:"Status"}
          ,{name:"Action"}
        ]
      }
    ];
  },
  bodyData: function(){
    return Session.get("myProtectionsFilteredData");
  }
});
