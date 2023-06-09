
// import { async } from 'https://cdn.skypack.dev/regenerator-runtime@0.13.9';
import {
    // QworumObject, QworumRuntime, QworumInterpreter,
    QworumRequest,
    message, 
    // CachedDatabase, 
    PlatformEntitlement,
    API, API_VERSION, APIClientType,
    UI
} from './modules/mod.mjs'; // use the build path, not the source path which is ./modules/mod.mts

// console.info(`APIClientType.WebPage === ${APIClientType.WebPage}`);
// console.info(`APIClientType.ContentScript === ${APIClientType.ContentScript}`);

// handle the extension initialisation events
chrome.runtime.onInstalled.addListener( (_event) => {
    console.info(`[Service worker] service worker installed`);

    // // Initialise the API
    // if (await API.init()) {
    //     // This is being done only once.

    //     // Listen to web requests (the service worker no longer needs to receive page navigation info from the content script, which reduces or eliminates race condition risks!).
    //     // Note: set host_permissions in manifest.json.
    //     chrome.webRequest.onCompleted.addListener(
    //         onWebRequestCompleted, webRequestFilter
    //     );
    // }
});
self.addEventListener('activate',  (_event) => {
    console.info(`[Service worker] service worker activated, using API version ${API_VERSION}`);

    // // Initialise the API
    // if (await API.init()) {
    //     // This is being done only once.

    //     // Listen to web requests (the service worker no longer needs to receive page navigation info from the content script, which reduces or eliminates race condition risks!).
    //     // Note: set host_permissions in manifest.json.
    //     chrome.webRequest.onCompleted.addListener(
    //         onWebRequestCompleted, webRequestFilter
    //     );
    // }

    // console.info(`[Service worker] chrome.omnibox.onInputChanged.addListener`);
    // chrome.omnibox.onInputChanged.addListener(omniboxInputChangeListener);
    // console.info(`[Service worker] done chrome.omnibox.onInputChanged.addListener`);

    // modify the extension icon

    // const canvas = new OffscreenCanvas(16, 16);
    // const context = canvas.getContext('2d');
    // context.clearRect(0, 0, 16, 16);
    // context.fillStyle = '#00FF00';  // Green
    // context.fillRect(0, 0, 16, 16);
    // const imageData = context.getImageData(0, 0, 16, 16);
    // chrome.action.setIcon({imageData: imageData}, () => { /* ... */ });

    // chrome.action.setIcon({path: '/assets/images/icons/Qworum-logo-alpha-16px-azure.png'});

    // chrome.action.setTitle({ title: "this" });

    // chrome.action.setBadgeText({ text: 'ON' });
    // chrome.action.setBadgeBackgroundColor({color: '#9958D1'});
    // UI.setInactive();
});

const
webRequestFilter = {
    urls: [
        "<all_urls>", // allow all origins defined in host_permissions in manifest.json
        // "http://127.0.0.1:8080/*",
        // "http://127.0.0.1:3000/*",
        // "http://127.0.0.1:5500/*",
        // "http://127.0.0.1:5501/*",
        // "http://127.0.0.1:5502/*",

        // "http://localhost:8080/*", 
        // "http://localhost:3000/*",
        // "http://localhost:5500/*"
        // "http://localhost:5501/*",
        // "http://localhost:5502/*",

        // "https://*.qworum.net/*"
    ],
    types: ["main_frame"]
},

// BUG use onWebRequestCompleted() instead of the 'Log page navigation' API endpoint
onWebRequestCompleted = async (details) => {
    // if (['prerender'].includes(details.documentLifecycle)) {
    if (!['active'].includes(details.documentLifecycle)) {
        console.debug(`[Service worker] ignoring web request, documentLifecycle is ${details.documentLifecycle}`);
        return;
    }
    
    // console.info(`[Service worker] web request completed: tabId=${details.tabId}, statusCode=${details.statusCode}, url=${details.url}`);
    console.info(`[Service worker] web request details:`,details);

    const
    request = {
        apiVersion: API_VERSION, endpoint: API.endpoints.navigationLogger, 
        apiClientType: APIClientType.ServiceWorker,
        body: {referrerUrl: null}
    },
    sender  = {tab: {id: details.tabId, url: details.url}},
    setTabbarStatus = (_response) => {
        // if(response.inSession){
        //     UI.setInSession(sender.tab.id);
        // }else{
        //     UI.setActive(sender.tab.id);
        // }
    };
    await apiHandler(request, sender, setTabbarStatus);
};

// omniboxInputChangeListener = (text, suggest) => {
//     console.log('inputChanged: ' + text);
//     suggest([
//         {content: text + " one", description: "the first one"},
//         {content: text + " number two", description: "the second entry"}
//     ]);
//     // chrome.tabs.query(
//     //     {active: true, currentWindow: true}, 
//     //     (tabs) => {
//     //         const tab = tabs[0];
//     //         console.debug(`omnibox input has changed for tab`,tab.id);

//     //     }
//     // );
//     // UI.setActive(sender.tab.id);
// };



// Remove the session states of closing tabs
// https://developer.chrome.com/docs/extensions/reference/tabs/#event-onRemoved
chrome.tabs.onRemoved.addListener(
    async (tabId, _removeInfo) => {
        try {
            // const tab = await chrome.tabs.get(tabId);
            const
            request = {
                apiVersion: API_VERSION, endpoint: API.endpoints.tabCloser, 
                apiClientType: APIClientType.ServiceWorker,
                body: {}
            },
            sender  = {tab: {id: tabId, url: 'https://unused'}};

            await API.handleRequest(request, sender);
        } catch (error) {
            console.error(`[Service worker] Error while closing tab: ${error}`);
        }
    }
);

// Respond to requests incoming from the extension's content script and from web pages
const 
enforcePlatformEntitlements = 
(pageUrl) => { // @param {URL} pageUrl, @returns {APIRequest | null}
    if (PlatformEntitlement.for(pageUrl)) return null; // BUG subdomain entitlement should check nb of used subdomains

    const
    script = message.Script.build(message.PlatformFault.build('platform entitlement')),
    request = {
        apiVersion   : API_VERSION,
        endpoint     : API.endpoints.scriptEvaluator,
        apiClientType: APIClientType.ContentScript, // make the API accept the entitlement fault
        body         : {xml: script.toXml()}
    };

    return request;
},

apiHandler = 
async (request, sender, sendResponse) => {
    try {
        const response = await API.handleRequest(request, sender); // APIResponse

        // enforce platform entitlements for outgoing responses (needs to be done for script evaluations)
        if (
            request.endpoint === API.endpoints.scriptEvaluator &&
            response.body.webRequest
        ) {
            const webRequest = QworumRequest.fromJsonable(response.body.webRequest);
            request = enforcePlatformEntitlements(webRequest.url);

            if (request) {
                await apiHandler(request, sender, sendResponse); // recursive !
                return;
            }
        }

        // console.debug('[Service worker] request:', request);
        // console.debug('[Service worker] response:', response);
        if (response.inSession) {
            UI.setInSession(sender.tab.id);
        } else {
            UI.setActive(sender.tab.id);
        }

        sendResponse(response);
    } catch (error) {
        console.error(`[Service worker] Error while handling incoming request: ${error}`);
    }
    return true;
},

apiHandlerForContentScript = 
(request, sender, sendResponse) => {
    try {
        // enforce platform entitlements for incoming requests (needs to be done once per page, when navlogging)
        // if (request.endpoint === API.endpoints.navigationLogger) { // TODO remove this, because the content script no longer does nav logging
        //     const tabUrl = new URL(sender.tab.url);
        //     request = enforcePlatformEntitlements(tabUrl) || request;
        // }

        // set the client type
        request.apiClientType = APIClientType.ContentScript;

        // call the api
        apiHandler(request, sender, sendResponse);
    } catch (error) {
        console.error(`[Service worker] Error while handling a request coming from the content script: ${error}`);
    }
    return true;
},

apiHandlerForWebPage = 
(request, sender, sendResponse) => {
    try {
        // web pages don't have access to navigation logging
        if (request.endpoint === API.endpoints.navigationLogger) {
            sendResponse({
                apiVersion: API_VERSION,
                status: {code: 403, message: "Forbidden"},
                body: {message: `Endpoint not accessible for web pages: ${request.endpoint}`}
            }); 
            return;
        }

        // set the client type
        request.apiClientType = APIClientType.WebPage;

        // call the api
        apiHandler(request, sender, sendResponse);
    } catch (error) {
        console.error(`[Service worker] Error while handling a request coming from a web page: ${error}`);
    }
    return true;
}
;

/*
    Respond to requests incoming from the extension's content script.

    Note: 
    Listener must return true, merely calling sendResponse isn't enough !!!
    Official documentation: https://developer.chrome.com/docs/extensions/mv3/messaging/#simple
    Also look here: https://stackoverflow.com/questions/48107746/chrome-extension-message-not-sending-response-undefined
 */
chrome.runtime.onMessage.addListener(apiHandlerForContentScript);

/* 
Respond to requests incoming from web pages

MASSIVE CONSTRAINT: 
For Chrome, the Qworum extension must list in the `manifest.json` file all origins that wish to communicate with the Qworum extension (origins must be 2nd-level domains) !!! (see the Chrome link below).

Use `runtime.onMessageExternal` for calling the Qworum extension from web pages.
https://developer.chrome.com/docs/extensions/mv3/messaging/#external-webpage
https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessageExternal
*/
chrome.runtime.onMessageExternal.addListener(apiHandlerForWebPage);



// Listen to web requests (the service worker no longer needs to receive page navigation info from the content script, which reduces or eliminates race condition risks!).
// Note: set host_permissions in manifest.json.
chrome.webRequest.onCompleted.addListener(
    onWebRequestCompleted, webRequestFilter
);


// do this last because this returns a Promise and await is disallowed here?
API.init(); // returns a Promise






// const my = {
//     log: function (message) {
//                 console.log(`${message}`);
//     },
//     init: () => MyDB.init()
// }

// // In-memory store for user profiles
// class MyUserProfiles { // BUG work in progress
//     static userProfiles = []; // [{userProfileId: number, profileName: string, userId: string, credential: array, userIsSignedIntoProfile: boolean, isCurrentProfile: boolean}]

//     // createProfile(credential: object, userId: string) // Only credential is required. New account if no userId. User can change default name afterwards.
//     // signIntoProfile(credential: object) // sign into profile and set it as the current profile
//     // switchToProfile(userProfileId)
//     // signOut() // sign out from all profiles

//     static findUserProfile(userProfileId) {
//         // my.log(`[MyUserProfiles.findRuntime] userProfileId: ${userProfileId}`);
//         const entry = this.userProfiles.find(r => r.userProfileId === userProfileId);
//         if (!entry) return null;
//         return entry;
//     }

//     static setUserProfile(tabId, runtime) {
//         my.log(`[MyUserProfiles.setRuntime] tabId: ${tabId}`);
//         const entry = this.userProfiles.find(r => r.tabId === tabId);
//         if (entry) {
//             entry.runtime = runtime;
//         } else {
//             this.userProfiles.push({ tabId, runtime });
//         }
//         MyDB.put(tabId, runtime);
//     }

//     static unsetUserProfile(tabId) {
//         my.log(`[MyUserProfiles.unsetRuntime] tabId: ${tabId}`);
//         const index = this.userProfiles.findIndex(e => e.tabId === tabId);
//         if (index === -1) return;
//         this.userProfiles.splice(index, 1);
//         MyDB.delete(tabId);
//     }

//     // if url is specified, creates a new runtime for tab if it does not exist
//     static getUserProfile(tabId, url) {
//         if (url) {
//             my.log(`[MyUserProfiles.getRuntime] tabId: ${tabId}, url: ${url}`);
//         } else {
//             my.log(`[MyUserProfiles.getRuntime] tabId: ${tabId}`);
//         }
//         let runtime = this.findUserProfile(tabId);
//         if (!runtime && url) {
//             runtime = QworumRuntime.build(
//                 QworumObject.build(new URL(new URL(`${url}`).origin))
//             );
//             this.setUserProfile(tabId, runtime);
//         }
//         return runtime;
//     }
// }

// // In-memory store for runtimes
// class MyRuntimes {
//     static runtimes = []; // [{tabId: number, runtime: QworumRuntime}]

//     static findRuntime(tabId) {
//         // my.log(`[MyRuntimes.findRuntime] tabId: ${tabId}`);
//         const entry = this.runtimes.find(r => r.tabId === tabId);
//         if (!entry) return null;
//         return entry.runtime;
//     }

//     static setRuntime(tabId, runtime) {
//         my.log(`[MyRuntimes.setRuntime] tabId: ${tabId}`);
//         const entry = this.runtimes.find(r => r.tabId === tabId);
//         if (entry) {
//             entry.runtime = runtime;
//         } else {
//             this.runtimes.push({ tabId, runtime });
//         }
//         MyDB.put(tabId, runtime);
//     }

//     static unsetRuntime(tabId) {
//         my.log(`[MyRuntimes.unsetRuntime] tabId: ${tabId}`);
//         const index = this.runtimes.findIndex(e => e.tabId === tabId);
//         if (index === -1) return;
//         this.runtimes.splice(index, 1);
//         MyDB.delete(tabId);
//     }

//     // if url is specified, creates a new runtime for tab if it does not exist
//     static getRuntime(tabId, url) {
//         if (url) {
//             my.log(`[MyRuntimes.getRuntime] tabId: ${tabId}, url: ${url}`);
//         } else {
//             my.log(`[MyRuntimes.getRuntime] tabId: ${tabId}`);
//         }
//         let runtime = this.findRuntime(tabId);
//         if (!runtime && url) {
//             runtime = QworumRuntime.build(
//                 QworumObject.build(new URL(new URL(`${url}`).origin))
//             );
//             this.setRuntime(tabId, runtime);
//         }
//         return runtime;
//     }
// }

// // InstantDB store for runtimes
// class MyDB {
//     static db;

//     // read runtimes from db (migrate db first if needed).
//     static init() {
//         my.log(`[MyDB.init] ...`);
//         const request = indexedDB.open('Qworum', 1);

//         request.onupgradeneeded = function (event) {
//             my.log(`[MyDB.init] upgrading the database from v${event.oldVersion} to v${event.newVersion}`);

//             // create the runtimes store
//             const
//             db               = event.target.result,
//             userProfilesStore = db.createObjectStore('userProfiles', { keyPath: "userProfileId", autoIncrement: true }),
//             runtimesStore    = db.createObjectStore('runtimes',     { keyPath: "tabId",          autoIncrement: false });

//             // user profiles can be searched by profile id (default, identifies at most one record)
//             // or user id (needs an index, identifies any number of records)
//             userProfilesStore.createIndex('userId', 'userId', {unique: false});
//         };

//         request.onsuccess = function (event) {
//             my.log(`[MyDB.init] database connection established.`);

//             // set MyDB.db
//             MyDB.db = event.target.result;

//             // set MyUserProfiles.userProfiles
//             MyDB.db.transaction('userProfiles').objectStore('userProfiles').getAll().onsuccess = function (event) {
//                 my.log(`[MyDB.init] reading all user profiles ...`);
//                 MyUserProfiles.userProfiles = event.target.result;
//                 my.log(`[MyDB.init] read all ${MyUserProfiles.userProfiles.length} user profiles.`);
//             };

//             // set MyRuntimes.runtimes
//             MyDB.db.transaction('runtimes').objectStore('runtimes').getAll().onsuccess = function (event) {
//                 my.log(`[MyDB.init] reading all runtimes ...`);
//                 MyRuntimes.runtimes =event.target.result.map(doc => ({
//                     tabId: doc.tabId, runtime: QworumRuntime.readIndexedDbObject(doc.runtime)
//                 }));
//                 my.log(`[MyDB.init] read all ${MyRuntimes.runtimes.length} runtimes.`);
//             };
//         };
//     }

//     static putUserProfile(userProfile) { 
//         my.log(`[MyDB.putUserProfile] ...`);
//         if (!this.db) {
//             my.log(`[MyDB.putUserProfile] error: db not set`);
//             return;
//         }
//         const transaction = this.db.transaction(['userProfiles'], 'readwrite');
//         transaction.oncomplete = function () {
//             my.log(`[MyDB.putUserProfile] transaction completed for profile of user ${userId}`);
//         };
//         transaction.onerror = function () {
//             my.log(`[MyDB.putUserProfile] transaction error for profile of user #${userId}`);
//         };

//         const
//         userProfilesStore = transaction.objectStore('userProfiles'),
//         requestPut        = userProfilesStore.put({ userProfile });

//         requestPut.onsuccess = function (event) {
//             my.log(`[MyDB.putUserProfile] profile set for user #${userId}`);
//         };
//         requestPut.onerror = function () {
//             my.log(`[MyDB.putUserProfile] error while setting profile for user #${userId}`);
//         };
//     }

//     static put(tabId, runtime) {
//         my.log(`[MyDB.put] ...`);
//         if (!this.db) {
//             my.log(`[MyDB.put] error: db not set`);
//             return;
//         }
//         const transaction = this.db.transaction(['runtimes'], 'readwrite');
//         transaction.oncomplete = function () {
//             my.log(`[MyDB.put] transaction completed for tab ${tabId}`);
//         };
//         transaction.onerror = function () {
//             my.log(`[MyDB.put] transaction error for tab #${tabId}`);
//         };

//         const
//             runtimesStore = transaction.objectStore('runtimes'),
//             requestPut = runtimesStore.put({ tabId, runtime: runtime.toIndexedDbObject() });

//         requestPut.onsuccess = function (event) {
//             my.log(`[MyDB.put] runtime set for tab #${tabId}`);
//         };
//         requestPut.onerror = function () {
//             my.log(`[MyDB.put] error while setting runtime for tab #${tabId}`);
//         };
//     }

//     static delete(tabId) {
//         my.log(`[MyDB.delete] ...`);
//         if (!this.db) {
//             my.log(`[MyDB.delete] error: db not set`);
//             return;
//         }

//         const
//             runtimesStore = this.db.transaction(['runtimes'], 'readwrite').objectStore('runtimes'),
//             requestDelete = runtimesStore.delete(tabId);

//         requestDelete.onsuccess = function (event) {
//             my.log(`[MyDB.delete] runtime deleted for tab #${tabId}`);
//         };
//         requestDelete.onerror = function (event) {
//             my.log(`[MyDB.delete] error while deleting runtime for tab #${tabId}`);
//         };
//     }

// }

// // handle extension intialization
// chrome.runtime.onInstalled.addListener(() => {
//     my.log(`[onInstalled] Service worker is installed.`);
//     // my.log(`[onInstalled] Service worker is using Qworum interpreter v${INTERPRETER_VERSION}`);
// });

// self.addEventListener('activate', function (event) {
//     my.log(`[activate] service worker activated`);
//     my.init();
// });

// // handle content script messages
// chrome.runtime.onMessage.addListener(
//     function (contentScriptMessage, sender, sendResponse) {
//         my.log(`[onMessage] message from content script`);
//         const
//             Script = message.Script.build,
//             Fault = message.Fault.build,
//             Json = message.Json.build,           // used for testing only
//             PhaseParameters = message.PhaseParameters.build,     // used for testing only
//             tabId = sender.tab.id,
//             url = contentScriptMessage.url ? new URL(contentScriptMessage.url) : null,
//             createContentScriptResponse = function (tabId, evalResult) {
//                 const
//                     runtime = MyRuntimes.getRuntime(tabId),
//                     inSession = runtime ? true : false;

//                 if (!evalResult) {
//                     return { type: 'info', inSession };
//                 }

//                 let response;
//                 if (evalResult instanceof QworumRequest) {
//                     response = {
//                         type: 'request',
//                         url: evalResult.url.href,
//                         phaseParameters: evalResult.phaseParameters ? evalResult.phaseParameters.toXml() : null,
//                         inSession
//                     };
//                 } else { // evalResult is data or a fault
//                     if (evalResult instanceof message.Fault) {
//                         response = {
//                             type: 'fault',
//                             faultType: evalResult.type,
//                             inSession
//                         };
//                     } else { // evalResult is data
//                         let data = null;
//                         if (evalResult instanceof message.Json) data = evalResult.value;
//                         response = {
//                             type: 'data', data,
//                             inSession
//                         };
//                     }
//                 };

//                 return response;
//             };

//         my.log(`[onMessage] from content script in tab "${tabId}": ${JSON.stringify(contentScriptMessage)}`);

//         // sendResponse({type: 'request', url: 'https://lwn.net/'}); return; // BUG erase this line
//         // sendResponse({type: 'request', url: 'https://lwn.net/', phaseParameters: PhaseParameters([{name: 'p1', value: Json(2)}]).toXml()}); return; // BUG erase this line

//         // Referrer-less HTTP responses finish any current Qworum session
//         if (!contentScriptMessage.referrer) {
//             MyRuntimes.unsetRuntime(tabId);
//         }

//         let response = { type: '[Content script API v1] noop' };

//         switch (contentScriptMessage.type) {
//             case '[Content script API v1] close tab':
//                 try {
//                     chrome.tabs.remove(tabId);
//                 } catch (error) {
//                     my.log(`[onMessage] error while closing the tab: ${error}`);
//                 }
//                 response = createContentScriptResponse(tabId);
//                 break;
//             case '[Content script API v1] xml':
//                 try {
//                     const
//                         script = message.Script.fromXml(contentScriptMessage.xml), // throws an exception if the XML is not a Qworum script
//                         runtime = MyRuntimes.getRuntime(tabId, url), // XML is a valid script; create a runtime for tab if needed
//                         evalResult = QworumInterpreter.eval(script, url, runtime);

//                     if (!(evalResult instanceof QworumRequest)) {
//                         MyRuntimes.unsetRuntime(tabId); // end of the execution
//                     } else {
//                         MyRuntimes.setRuntime(tabId, runtime); // persist the new run-time state to IndexedDB
//                     }

//                     my.log(`[onMessage] In session; valid script: ${script}; evaluate.`);
//                     response = createContentScriptResponse(tabId, evalResult);
//                     //   my.log(`[onMessage] evaluated.`);

//                 } catch (error) {
//                     my.log(`[onMessage] error: ${error}`);
//                     // the XML is not a valid script
//                     const runtime = MyRuntimes.getRuntime(tabId);

//                     if (runtime) { // in a Qworum session; raise a Qworum Fault
//                         my.log(`[onMessage] In session; XML is not a script; raise fault.`);
//                         const
//                             script = Script(Fault('service')),
//                             evalResult = QworumInterpreter.eval(script, url, runtime);

//                         if (!(evalResult instanceof QworumRequest)) {
//                             MyRuntimes.unsetRuntime(tabId); // end of the execution
//                         } else {
//                             MyRuntimes.setRuntime(tabId, runtime); // persist the new run-time state to IndexedDB
//                         }

//                         response = createContentScriptResponse(tabId, evalResult);
//                     } else {
//                         my.log(`[onMessage] No session; XML is not a script.`);
//                         response = createContentScriptResponse(tabId);
//                     }
//                 }
//                 break;

//             case '[Content script API v1] not xml':
//                 if (contentScriptMessage.contentType.indexOf('html') === -1) { // not an HTML page; don't ignore
//                     if (MyRuntimes.getRuntime(tabId)) { // in a Qworum session; raise a Qworum Fault
//                         my.log(`[onMessage] In session; page is neither HTML nor XML; raise fault.`);
//                         const
//                             script = Script(Fault('service')),
//                             runtime = MyRuntimes.getRuntime(tabId),
//                             evalResult = QworumInterpreter.eval(script, url, runtime);

//                         if (!(evalResult instanceof QworumRequest)) {
//                             MyRuntimes.unsetRuntime(tabId); // end of the execution
//                         } else {
//                             MyRuntimes.setRuntime(tabId, runtime); // persist the new run-time state to IndexedDB
//                         }

//                         response = createContentScriptResponse(tabId, evalResult);
//                     } else {
//                         my.log(`[onMessage] No session; page is not HTML.`);
//                         response = createContentScriptResponse(tabId);
//                     }
//                 } else {
//                     my.log(`[onMessage] Page is HTML.`);
//                     response = createContentScriptResponse(tabId);
//                 }
//                 break;

//             default:
//                 my.log(`[onMessage] Unknown message type: ${contentScriptMessage.type}`);
//         }

//         my.log(`[onMessage] sending response: ${JSON.stringify(response)}`);
//         sendResponse(response);
//         // my.log(`[onMessage] sent response.`);
//     }
// );

// // Handle messages incoming from web pages (messages are not sent by the content script, but by a web page).
// // 
// // MASSIVE CONSTRAINT: 
// // For Chrome, the Qworum extension must list in the `manifest.json` file all origins that wish to communicate with the Qworum extension (origins must be 2nd-level domains) !!! (see the Chrome link below).
// // 
// // Use `runtime.onMessageExternal` for calling the Qworum extension from web pages.
// // (LISTENER MUST BE IN SERVICE WORKER, NOT CONTENT SCRIPT !!!):
// // https://developer.chrome.com/docs/extensions/mv3/messaging/#external-webpage
// // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessageExternal
// chrome.runtime.onMessageExternal.addListener(
//     // WARNING make sure that the website sending the request is whitelisted in manifest.json
//     function (request, sender, sendResponse) {
//         const
//         badRequest   = { status: 400 },
//         ok           = { status: 200 },
//         notFound     = { status: 404 },
//         unknownError = { status: 500 },
//         url          = new URL(sender.url),
//         tabId        = sender.tab.id;

//         let
//         runtime = request.type !== 'ping' ? MyRuntimes.getRuntime(tabId) : null,
//         value = null,
//         pathOfData = request.type.match(/data$/) ? request.path : null;

//         if (pathOfData) {
//             if (typeof pathOfData === 'string') pathOfData = [pathOfData];
//             if (!(pathOfData instanceof Array)) {
//                 sendResponse(badRequest); return;
//             }
//         }

//         my.log(`[from web page] ${JSON.stringify(request)}`);

//         switch (request.type) {
//             case '[Runtime API v1] in session?':
//                 ok.inSession = MyRuntimes.getRuntime(tabId) ? true : false;
//                 sendResponse(ok);
//                 break;
//             // case '[Runtime API v1] eval script': // TODO receive script in json format
//             case '[Runtime API v1] eval xml script':
//                 my.log(`[from web page] eval script`);
//                 try {
//                     let script;
//                     try {
//                         script = message.Script.fromXml(request.script);
//                         my.log(`[from web page] will eval ${script}`);
//                     } catch (error) {
//                         my.log(`[from web page] ${error}`);
//                         // not a Qworum script
//                         sendResponse(badRequest); return;
//                     }

//                     runtime = MyRuntimes.getRuntime(tabId, url); // XML is a valid script; create a runtime for tab if needed
//                     // runtime ||= MyRuntimes.getRuntime(tabId, url); // XML is a valid script; create a runtime for tab if needed
//                     my.log(`[from web page] tab has runtime: ${!!runtime}`);
//                     const evalResult = QworumInterpreter.eval(script, url, runtime);
//                     my.log(`[from web page] result of eval: ${evalResult}`);

//                     // maintain runtime
//                     if (!(evalResult instanceof QworumRequest)) {
//                         my.log(`[from web page] deleting runtime for tab`);
//                         MyRuntimes.unsetRuntime(tabId); // end of the execution
//                     } else {
//                         my.log(`[from web page] updating runtime for tab`);
//                         MyRuntimes.setRuntime(tabId, runtime); // persist the new run-time state to IndexedDB
//                     }

//                     // send reponse to the web page
//                     if (evalResult instanceof message.Fault) {
//                         my.log(`[from web page] eval result is fault`);
//                         // ok.body = {data: message.Json.build(3).toIndexedDb()};
//                         ok.body = { fault: evalResult.toIndexedDb() };
//                     } else if (evalResult instanceof message.GenericData) {
//                         my.log(`[from web page] eval result is data`);
//                         ok.body = { data: evalResult.toIndexedDb() };
//                     } else if (evalResult instanceof QworumRequest) {
//                         my.log(`[from web page] eval result is http(s) request`);
//                         ok.body = { webRequest: evalResult.toJsonable() };
//                     } else {
//                         throw new Error('interpreter returned non-standard response')
//                     }
//                     my.log(`[from web page] sending response to the web page: ${evalResult}`);
//                     sendResponse(ok);
//                 } catch (error) {
//                     my.log(`[from web page] error: ${error}`);
//                     sendResponse(unknownError);
//                 }
//                 break;
//             case '[Runtime API v1] get data':
//                 if (!pathOfData) {
//                     sendResponse(badRequest);
//                     break;
//                 }
//                 try {
//                     value = runtime.getData(pathOfData);
//                     if (!value) {
//                         notFound.runtime = runtime.toIndexedDbObject();
//                         sendResponse(notFound); break;
//                     }
//                     value = value.toIndexedDb();
//                     ok.body = value;
//                     sendResponse(ok);
//                 } catch (error) {
//                     my.log(`[Runtime API v1] get data: error: ${error}`);
//                     sendResponse(unknownError);
//                 }
//                 break;
//             case '[Runtime API v1] set data':
//                 if (!pathOfData) {
//                     sendResponse(badRequest);
//                     break;
//                 }
//                 try {
//                     value = null; //
//                     try {
//                         value = message.Json.fromIndexedDb(request.value);
//                         my.log(`[Runtime API v1] set data: is Json`);
//                     } catch (error) {
//                         try {
//                             value = message.SemanticData.fromIndexedDb(request.value);
//                             my.log(`[Runtime API v1] set data: is SemanticData`);
//                         } catch (error) {
//                             my.log(`[Runtime API v1] set data: unknown data`);
//                         }
//                     }
//                     if (value) {
//                         my.log(`[Runtime API v1] set data: writing...`);
//                         value = runtime.setData(pathOfData, value);
//                         sendResponse(ok); // ok?
//                     } else {
//                         my.log(`[Runtime API v1] set data: not writing`);
//                         sendResponse(badRequest);
//                     }
//                 } catch (error) {
//                     my.log(`[Runtime API v1] set data: error: ${error}`);
//                     sendResponse(unknownError);
//                 }
//                 break;


//             case '[Browser extension API v1] ping':
//                 ok.body = request;
//                 sendResponse(ok);
//                 break;
//             default:
//                 break;
//         }

//     }
// );

// // remove the runtime of a tab that is closing
// // https://developer.chrome.com/docs/extensions/reference/tabs/#event-onRemoved
// chrome.tabs.onRemoved.addListener(
//     (tabId, removeInfo) => MyRuntimes.unsetRuntime(tabId)
// );
