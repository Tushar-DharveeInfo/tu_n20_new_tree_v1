# patch history:
4
to .env file of nz20 project root
add one more line
VITE_API_AT="n20api"

also add its declaration in global.d.ts file

use this variable to get api path

also add attached README.md


##################################################################################################
3
Step-by-step, Update nz20 app project for Config.js
0
We will add two .env files to project root folder 
Make sure .env file is in project root and has all vars defined as needed to build and at runtime
.env
VITE_TENANT_NICKNAME="netzoom-uhjpe"
VITE_TENANT_DISPLAY_NAME="NetZoom"
VITE_AUTH_TYPE="basic"
VITE_API_AT="n20api"
VITE_NODE_ENV="development"


.env.production
VITE_TENANT_NICKNAME="netzoom-uhjp???????"
VITE_TENANT_DISPLAY_NAME="NetZoom"
VITE_AUTH_TYPE="fb"
VITE_API_AT="n20api"
VITE_NODE_ENV="production"

//we can add more vars if needed
Note: To complete the deployment of n20, administrator must update these variables in config.js.
What are these variables in env file
VITE_TENANT_NICKNAME="netzoom-uhjpe"
VITE_TENANT_DISPLAY_NAME="NetZoom"
VITE_AUTH_TYPE="fb"
VITE_API_AT="n20api"
VITE_NODE_ENV="development"

VITE_TENANT_NICKNAME="netzoom-uhjpe"
How it is used?
If a client wish to use google auth then client should be added to our client list(aka Tenant)  in firebase database using n20-toolbox; when client is added, a unique nick name is assigned to the client; This nickname identifies all users of that client for google auth
This VITE_TENANT_NICKNAME value is passed to google auth along with user name pwd to authenticate.

If user is choosing other than google auth, then its not used.

VITE_AUTH_TYPE="fb" this variable is used to determine if user auth should be using goole auth or basic or else
VITE_API_AT="n20api" this variable is used to suffix webapp baseurl to get to api url line https://www.netzoom.com/TESTAPI
VITE_NODE_ENV="development"
Change this to “production”, when ready to build for production

1
Add scripts folder to project root
Add both .env and .env.production files to project root

> npm run sync-config
sync-config creates config.js using .env;
basically,  extracts all .env and add them to public/<config>/config.js file
config.js provides .env variables to windows app

Note: build automatically creates config.js using .env.production

when index.html launches, this config.js is executed and all env in it are loaded and become available to the webapp via window.APP_CONFIG.<env key>

2
Add/update these lines to the script section in package.json
    "build": "tsc --noEmit && node scripts/sync-all-config.js --env .env.production && vite build",
    "sync-config":  "node scripts/sync-all-config.js",

Note: build automatically creates config.js and uses .env.production

3
run each time you change .env
> npm run sync-config

4
Add/update global.d.ts in your project’s src folder
these declarations to global.d.ts
        APP_CONFIG: {
            TENANT_NICKNAME: string;
            TENANT_DISPLAY_NAME: string;
            AUTH_TYPE: string;
            NODE_ENV: string;
        };

Make sure your tsconfig.app.json includes src
Note:
Type declaration files like global.d.ts belong in tsconfig.app.json's include/files scope
global.d.ts does not need to be referenced in any Vite config file. It's already covered by tsconfig.app.json, which includes "include": ["src"] — since global.d.ts lives in src, TypeScript picks it up automatically.

5
in authentication.tsx line 19, use like this
             <AppAuthRoot
                auth={auth}
                authType={(window.APP_CONFIG?.AUTH_TYPE || "fb") as "fb" | "basic" | "netzoom"}

6
now run your app


##################################################################################################
2
splitted libform container implementing top pane and bottom pane; display title in top pane and sections in bottom pane; offer vertical scroll bar in bottom pane only.

1
libform hyperlink, 
Provide absolute url (with protocol prefix like https:) relative URL will be prefixed with baseurl


# in package.json
1
"build": "tsc --noEmit && vite build"
vite build command automatically runs in production mode by default

2
Even though our project is webapp, we MUST declare it as module
  "type": "module",
it helps node.js treat it for ES Module syntax like Import instead Require

3

### vite.config.ts
1
# Leaving react({}) is OK, it means use defaults;
  plugins: [
    react({

    })],

2
# The server block in this file, is automatically ignored during production builds (vite build). It only applies when running the dev server (vite / vite dev).

You don't need to remove it. Vite only reads server config when in dev mode — it has no effect on the output of vite build.

3
# this minify line is edundant becasue during production build, vite minifies by default
    minify: 'esbuild',

4
I updated your Package.json	

Reason
1
these dependencies Removed because not is use 
basic	
@types/webfontloader

2
these dependencies kept/Added because needed
@n20a/libpanel	future use


3
these dependencies are no longer in our npm lib pkg list 
@n20a/libreportlayout	Imported in src but missing from dependencies 
review their reference in EditReportLayout.tsx and _EditReportLayout.tsx  to replace it

4
You must not define peerDependencies in this project

5
react and react-dom should be in dependencies section only
