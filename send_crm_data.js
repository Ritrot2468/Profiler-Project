
var accountID = null;

const fs = require('fs');
const path = require('path');

class ContactCreator {
    constructor(jsonFilePath, accountID) {
        this.accountID = accountID;

        // Read JSON data from the specified file path
        try {
            const jsonData = fs.readFileSync(path.resolve(jsonFilePath), 'utf-8');
            this.jsonData = JSON.parse(jsonData);
            console.log("Data loaded:", this.jsonData);
        } catch (error) {
            console.error("Error reading JSON data:", error);
            this.jsonData = null;
        }
    }

    getAccountDetailsAndCreateContact() {
        if (!this.accountID) {
            console.error("Account ID is required.");
            return;
        }

        // Ensure jsonData is loaded before proceeding
        if (!this.jsonData) {
            console.error("JSON data not loaded.");
            return;
        }

        // Process account details and create contact using the loaded data
        console.log("Account ID:", this.accountID);
        this.createContact(this.jsonData); // Use jsonData when creating a contact
    }

    createContact(data) {
        // Your createContact function code here
        console.log("Creating contact with data:", data);
    }
}

// Function to get account details and then create a contact using that information
function getAccountDetailsAndCreateContact(accountId, additionalData) {
    if (!accountId) {
        Xrm.Utility.alertDialog("Account ID is required.");
        return;
    }

    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: Xrm.Page.context.getClientUrl() + "/api/data/v9.1/accounts(" + accountId + ")?$select=accountid,_po_sap_accountgroupid_value,_po_sap_countryid_value,_po_sap_regionid_value",
        beforeSend: function(XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
            XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
            XMLHttpRequest.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
        },
        async: true,
        success: function(data) {
            // Extract account data
            var accountData = {
                accountBinding: "/accounts(" + data["accountid"] + ")",
                countryBinding: "/po_sap_countries(" + data["_po_sap_countryid_value"] + ")",
                regionBinding: "/po_sap_regions(" + data["_po_sap_regionid_value"] + ")",
                accountGroupID: data["_po_sap_accountgroupid_value"] // Additional field if needed
            };

            // Merge accountData with additionalData and pass to createContact
            var contactData = Object.assign({}, additionalData, accountData);
            createContact(contactData);
        },
        error: function(xhr, textStatus, errorThrown) {
            Xrm.Utility.alertDialog("Error: " + textStatus + " " + errorThrown);
        }
    });
}

// Function to create a contact using data from the account and additional JSON data
function createContact(data) {
    var entity = {};

    // Populate entity fields from data
    entity.firstname = data.name.split(" ")[0] || ""; // First name
    entity.lastname = data.name.split(" ")[1] || ""; // Last name
    entity["parentcustomerid_account@odata.bind"] = data.accountBinding; // Account binding from account data
    entity.marketingonly = data.marketingonly || null; // Marketing only
    entity.po_building = data.building || ""; // Building information
    entity.emailaddress1 = data.contact_info.email || ""; // Email address
    entity.po_labname = data.department || ""; // Department or lab name
    entity["po_sap_countryid@odata.bind"] = data.countryBinding; // SAP Country ID binding from account data
    entity["po_sap_regionid@odata.bind"] = data.regionBinding; // SAP Region ID binding from account data
    entity.department = data.faculty || ""; // Faculty
    entity.telephone1 = data.contact_info.phone || ""; // Phone number

    // XMLHttpRequest setup for Dynamics API
    var req = new XMLHttpRequest();
    req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/contacts", true);
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
    req.onreadystatechange = function() {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status === 204) {
                var uri = this.getResponseHeader("OData-EntityId");
                var regExp = /\(([^)]+)\)/;
                var matches = regExp.exec(uri);
                if (matches) {
                    var newEntityId = matches[1];
                    console.log("New Entity ID:", newEntityId);
                } else {
                    console.error("Entity ID not found in response header.");
                }
            } else {
                Xrm.Utility.alertDialog(this.statusText);
            }
        }
    };

    req.send(JSON.stringify(entity));
}

// Example JSON data for creating the contact
var ericJanData = {
    name: "Eric Jan",
    building: "Life Sciences Centre",
    department: "Department of Biochemistry & Molecular Biology",
    faculty: "Faculty of Medicine",
    research_areas: ["Virology", "RNA Biology", "Molecular Biology", "Protein Synthesis"],
    recent_publications: ["Title 1", "Title 2", "Title 3"],
    contact_info: {
        email: "eric.jan@ubc.ca",
        phone: "604-822-1234"
    }
};

// Set the account ID and call the function
accountID = "....."; 
getAccountDetailsAndCreateContact(accountID, ericJanData);