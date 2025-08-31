
> shopbot-mvp@1.0.0 test
> jest

node.exe : (node:14672) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a 
userland alternative instead.
At C:\Program Files\nodejs\npm.ps1:29 char:3
+   & $NODE_EXE $NPM_CLI_JS $args
+   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ((node:14672) [D...native instead.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
(Use `node --trace-deprecation ...` to show where the warning was created)
PASS tests/models/store.test.js
  ΓùÅ Console

    console.warn
      Warning during test cleanup: kill EPERM

    [0m [90m 57 |[39m   } [36mcatch[39m (error) {
     [90m 58 |[39m     [90m// Log but don't throw - cleanup errors shouldn't fail tests[39m
    [31m[1m>[22m[39m[90m 59 |[39m     console[33m.[39mwarn([32m'Warning during test 
cleanup:'[39m[33m,[39m error[33m.[39mmessage)[33m;[39m
     [90m    |[39m             [31m[1m^[22m[39m
     [90m 60 |[39m     
     [90m 61 |[39m     [90m// Force cleanup[39m
     [90m 62 |[39m     [36mif[39m (mongoServer) {[0m

      at warn (tests/setup.js:59:13)
      at Object.<anonymous> (tests/models/store.test.js:11:5)

    console.warn
      Force cleanup also failed: kill EPERM

    [0m [90m 64 |[39m         [36mawait[39m mongoServer[33m.[39mstop({ doCleanup[33m:[39m 
[36mfalse[39m[33m,[39m force[33m:[39m [36mtrue[39m })[33m;[39m
     [90m 65 |[39m       } [36mcatch[39m (forceError) {
    [31m[1m>[22m[39m[90m 66 |[39m         console[33m.[39mwarn([32m'Force cleanup also 
failed:'[39m[33m,[39m forceError[33m.[39mmessage)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 67 |[39m       }
     [90m 68 |[39m       mongoServer [33m=[39m [36mnull[39m[33m;[39m
     [90m 69 |[39m     }[0m

      at warn (tests/setup.js:66:17)
      at Object.<anonymous> (tests/models/store.test.js:11:5)

PASS tests/models/conversation.test.js
  ΓùÅ Console

    console.warn
      Warning during test cleanup: kill EPERM

    [0m [90m 57 |[39m   } [36mcatch[39m (error) {
     [90m 58 |[39m     [90m// Log but don't throw - cleanup errors shouldn't fail tests[39m
    [31m[1m>[22m[39m[90m 59 |[39m     console[33m.[39mwarn([32m'Warning during test 
cleanup:'[39m[33m,[39m error[33m.[39mmessage)[33m;[39m
     [90m    |[39m             [31m[1m^[22m[39m
     [90m 60 |[39m     
     [90m 61 |[39m     [90m// Force cleanup[39m
     [90m 62 |[39m     [36mif[39m (mongoServer) {[0m

      at warn (tests/setup.js:59:13)
      at Object.<anonymous> (tests/models/conversation.test.js:14:5)

    console.warn
      Force cleanup also failed: kill EPERM

    [0m [90m 64 |[39m         [36mawait[39m mongoServer[33m.[39mstop({ doCleanup[33m:[39m 
[36mfalse[39m[33m,[39m force[33m:[39m [36mtrue[39m })[33m;[39m
     [90m 65 |[39m       } [36mcatch[39m (forceError) {
    [31m[1m>[22m[39m[90m 66 |[39m         console[33m.[39mwarn([32m'Force cleanup also 
failed:'[39m[33m,[39m forceError[33m.[39mmessage)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 67 |[39m       }
     [90m 68 |[39m       mongoServer [33m=[39m [36mnull[39m[33m;[39m
     [90m 69 |[39m     }[0m

      at warn (tests/setup.js:66:17)
      at Object.<anonymous> (tests/models/conversation.test.js:14:5)

PASS tests/integrations/shopify.test.js

Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        5.684 s
Ran all test suites.
Warning during test cleanup: kill EPERM
Force cleanup also failed: kill EPERM
