      5 | const mongoose = require('mongoose');
    > 6 | const Chatbot = require('../../../models/chatbot.model');
        |                 ^
      7 |
      8 | describe('Chatbot Model', () => {
      9 |   // Test data

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/unit/models/chatbot.model.test.js:6:17)

 FAIL  tests/unit/models/analytics.model.test.js
  ● Test suite failed to run

    Cannot find module '../../../models/analytics.model' from 'tests/unit/models/analytics.model.test.js'

      4 |
      5 | const mongoose = require('mongoose');
    > 6 | const Analytics = require('../../../models/analytics.model');
        |                   ^
      7 |
      8 | describe('Analytics Model', () => {
      9 |   // Test data

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/unit/models/analytics.model.test.js:6:19)

 FAIL  tests/unit/controllers/chatbot.controller.test.js
  ● Test suite failed to run

    Cannot find module '../../../services/chatbot.service' from 'tests/unit/controllers/chatbot.controller.test.js'

       9 |
      10 | // Mock dependencies
    > 11 | jest.mock('../../../services/chatbot.service');
         |      ^
      12 | jest.mock('../../../utils', () => ({
      13 |   logger: {
      14 |     debug: jest.fn(),

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/controllers/chatbot.controller.test.js:11:6)

 FAIL  tests/unit/controllers/model.controller.test.js
  ● Test suite failed to run

    Cannot find module '../../../services/local-model.service' from 'tests/unit/controllers/model.controller.test.js'

       7 |
       8 | // Mock dependencies
    >  9 | jest.mock('../../../services/local-model.service');
         |      ^
      10 |
      11 | describe('Model Controller', () => {
      12 |   let req, res;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/controllers/model.controller.test.js:9:6)

 FAIL  tests/unit/bot/base.engine.test.js
  ● Test suite failed to run

    Cannot find module '../../../bot/engines/base.engine' from 'tests/unit/bot/base.engine.test.js'

      4 |
      5 | // Import the base engine
    > 6 | const BaseChatbotEngine = require('../../../bot/engines/base.engine');
        |                           ^
      7 |
      8 | describe('Base Chatbot Engine', () => {
      9 |   describe('Constructor', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/unit/bot/base.engine.test.js:6:27)

 FAIL  tests/unit/bot/engine.factory.test.js
  ● Test suite failed to run

    Cannot find module '../../../utils' from 'tests/unit/bot/engine.factory.test.js'

      4 |
      5 | // Mock dependencies before importing the engine factory
    > 6 | jest.mock('../../../utils', () => ({
        |      ^
      7 |   logger: {
      8 |     debug: jest.fn(),
      9 |     info: jest.fn(),

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/bot/engine.factory.test.js:6:6)

 FAIL  tests/integration/api/integration.api.test.js
  ● Test suite failed to run

    Cannot find module '../../../app' from 'tests/integration/api/integration.api.test.js'

       5 | const request = require('supertest');
       6 | const mongoose = require('mongoose');
    >  7 | const { app } = require('../../../app');
         |                 ^
       8 | const Integration = require('../../../models/integration.model');
       9 | const Chatbot = require('../../../models/chatbot.model');
      10 | const User = require('../../../models/user.model');

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/integration/api/integration.api.test.js:7:17)

 FAIL  tests/unit/auth/auth.service.test.js
  ● Test suite failed to run

    Cannot find module '../../../models/user.model' from 'tests/unit/auth/auth.service.test.js'

      22 | }));
      23 |
    > 24 | jest.mock('../../../models/user.model', () => {
         |      ^
      25 |   return {
      26 |     findById: jest.fn().mockImplementation(id => {
      27 |       if (id === 'user123') {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/auth/auth.service.test.js:24:6)

 FAIL  tests/unit/auth/auth.middleware.test.js
  ● Test suite failed to run

    Cannot find module '../../../auth/auth.service' from 'tests/unit/auth/auth.middleware.test.js'

      4 |
      5 | // Mock dependencies before importing the auth middleware
    > 6 | jest.mock('../../../auth/auth.service', () => ({
        |      ^
      7 |   verifyToken: jest.fn().mockImplementation(token => {
      8 |     if (token === 'valid-token') {
      9 |       return Promise.resolve({ userId: 'user123', role: 'user' });

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/auth/auth.middleware.test.js:6:6)

 FAIL  tests/integration/api/auth.api.test.js
  ● Test suite failed to run

    Cannot find module '../../../app' from 'tests/integration/api/auth.api.test.js'

       6 | const mongoose = require('mongoose');
       7 | const bcrypt = require('bcryptjs');
    >  8 | const { app } = require('../../../app');
         |                 ^
       9 | const User = require('../../../models/user.model');
      10 | require('@tests/utils\test-helpers');
      11 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/integration/api/auth.api.test.js:8:17)

 FAIL  src/tests/unit/conversation.service.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/servicesconversation.service mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

       7 | const mongoose = require('mongoose');
       8 | const { MongoMemoryServer } = require('mongodb-memory-server');
    >  9 | require('@src/services\conversation.service');
         | ^
      10 | require('@src/database\schemas\conversation.schema');
      11 |
      12 | // Mock logger to prevent console output during tests

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (src/tests/unit/conversation.service.test.js:9:1)

 FAIL  src/tests/unit/app.test.js
  ● Test suite failed to run

    Cannot find module '../../../database/db.connection' from 'src/tests/unit/app.test.js'

      28 | }));
      29 |
    > 30 | jest.mock('../../../database/db.connection', () => ({
         |      ^
      31 |   connectDB: jest.fn().mockResolvedValue(true)
      32 | }));
      33 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (src/tests/unit/app.test.js:30:6)

 FAIL  src/tests/uat/chatbot-management.spec.js
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option. 

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    SyntaxError: C:\Users\ajelacn\Documents\chatbots\src\tests\uat\chatbot-management.spec.js: Bad character escape sequence. (9:21)

       7 |
       8 | const { test, expect } = require('@playwright/test');
    >  9 | require('@src/tests\uat\setup');
         |                      ^
      10 |
      11 | // Test suite for chatbot management
      12 | test.describe('Chatbot Management', () => {

      at constructor (node_modules/@babel/parser/src/parse-error.ts:95:45)
      at JSXParserMixin.toParseError [as raise] (node_modules/@babel/parser/src/tokenizer/index.ts:1503:19)
      at Object.raise [as invalidEscapeSequence] (node_modules/@babel/parser/src/tokenizer/index.ts:1576:12)
      at invalidEscapeSequence (node_modules/@babel/babel-helper-string-parser/src/index.ts:293:14)
      at readHexChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:449:22)
      at readCodePoint (node_modules/@babel/babel-helper-string-parser/src/index.ts:191:24)
      at readEscapedChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:80:19)
      at JSXParserMixin.readStringContents [as readString] (node_modules/@babel/parser/src/tokenizer/index.ts:1336:46)
      at JSXParserMixin.readString (node_modules/@babel/parser/src/tokenizer/index.ts:991:14)
      at JSXParserMixin.getTokenFromCode (node_modules/@babel/parser/src/plugins/jsx/index.ts:631:13)
      at JSXParserMixin.getTokenFromCode [as nextToken] (node_modules/@babel/parser/src/tokenizer/index.ts:278:10)
      at JSXParserMixin.nextToken [as next] (node_modules/@babel/parser/src/tokenizer/index.ts:121:10)
      at JSXParserMixin.next [as parseCoverCallAndAsyncArrowHead] (node_modules/@babel/parser/src/parser/expression.ts:888:10)
      at JSXParserMixin.parseCoverCallAndAsyncArrowHead [as parseSubscript] (node_modules/@babel/parser/src/parser/expression.ts:790:19)    
      at JSXParserMixin.parseSubscript [as parseSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:749:19)
      at JSXParserMixin.parseSubscripts [as parseExprSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:734:17)
      at JSXParserMixin.parseExprSubscripts [as parseUpdate] (node_modules/@babel/parser/src/parser/expression.ts:707:21)
      at JSXParserMixin.parseUpdate [as parseMaybeUnary] (node_modules/@babel/parser/src/parser/expression.ts:669:23)
      at JSXParserMixin.parseMaybeUnary [as parseMaybeUnaryOrPrivate] (node_modules/@babel/parser/src/parser/expression.ts:403:14)
      at JSXParserMixin.parseMaybeUnaryOrPrivate [as parseExprOps] (node_modules/@babel/parser/src/parser/expression.ts:415:23)
      at JSXParserMixin.parseExprOps [as parseMaybeConditional] (node_modules/@babel/parser/src/parser/expression.ts:370:23)
      at JSXParserMixin.parseMaybeConditional [as parseMaybeAssign] (node_modules/@babel/parser/src/parser/expression.ts:301:21)
      at JSXParserMixin.parseMaybeAssign [as parseExpressionBase] (node_modules/@babel/parser/src/parser/expression.ts:226:23)
      at parseExpressionBase (node_modules/@babel/parser/src/parser/expression.ts:217:39)
      at JSXParserMixin.callback [as allowInAnd] (node_modules/@babel/parser/src/parser/expression.ts:3144:16)
      at JSXParserMixin.allowInAnd [as parseExpression] (node_modules/@babel/parser/src/parser/expression.ts:217:17)
      at JSXParserMixin.parseExpression [as parseStatementContent] (node_modules/@babel/parser/src/parser/statement.ts:675:23)
      at JSXParserMixin.parseStatementContent [as parseStatementLike] (node_modules/@babel/parser/src/parser/statement.ts:468:17)
      at JSXParserMixin.parseStatementLike [as parseModuleItem] (node_modules/@babel/parser/src/parser/statement.ts:405:17)
      at JSXParserMixin.parseModuleItem [as parseBlockOrModuleBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1434:16)       
      at JSXParserMixin.parseBlockOrModuleBlockBody [as parseBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1408:10)        
      at JSXParserMixin.parseBlockBody [as parseProgram] (node_modules/@babel/parser/src/parser/statement.ts:225:10)
      at JSXParserMixin.parseProgram [as parseTopLevel] (node_modules/@babel/parser/src/parser/statement.ts:203:25)
      at JSXParserMixin.parseTopLevel [as parse] (node_modules/@babel/parser/src/parser/index.ts:93:10)
      at parse (node_modules/@babel/parser/src/index.ts:92:38)
      at parser (node_modules/@babel/core/src/parser/index.ts:28:19)
          at parser.next (<anonymous>)
      at normalizeFile (node_modules/@babel/core/src/transformation/normalize-file.ts:49:24)
          at normalizeFile.next (<anonymous>)
      at run (node_modules/@babel/core/src/transformation/index.ts:40:36)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/src/transform.ts:29:20)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at fn (node_modules/@babel/core/src/errors/rewrite-stack-trace.ts:99:14)
      at transformSync (node_modules/@babel/core/src/transform.ts:66:52)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

 FAIL  src/tests/uat/knowledge-base.spec.js
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option. 

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    SyntaxError: C:\Users\ajelacn\Documents\chatbots\src\tests\uat\knowledge-base.spec.js: Bad character escape sequence. (9:21)

       7 |
       8 | const { test, expect } = require('@playwright/test');
    >  9 | require('@src/tests\uat\setup');
         |                      ^
      10 |
      11 | // Test suite for knowledge base management
      12 | test.describe('Knowledge Base Management', () => {

      at constructor (node_modules/@babel/parser/src/parse-error.ts:95:45)
      at JSXParserMixin.toParseError [as raise] (node_modules/@babel/parser/src/tokenizer/index.ts:1503:19)
      at Object.raise [as invalidEscapeSequence] (node_modules/@babel/parser/src/tokenizer/index.ts:1576:12)
      at invalidEscapeSequence (node_modules/@babel/babel-helper-string-parser/src/index.ts:293:14)
      at readHexChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:449:22)
      at readCodePoint (node_modules/@babel/babel-helper-string-parser/src/index.ts:191:24)
      at readEscapedChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:80:19)
      at JSXParserMixin.readStringContents [as readString] (node_modules/@babel/parser/src/tokenizer/index.ts:1336:46)
      at JSXParserMixin.readString (node_modules/@babel/parser/src/tokenizer/index.ts:991:14)
      at JSXParserMixin.getTokenFromCode (node_modules/@babel/parser/src/plugins/jsx/index.ts:631:13)
      at JSXParserMixin.getTokenFromCode [as nextToken] (node_modules/@babel/parser/src/tokenizer/index.ts:278:10)
      at JSXParserMixin.nextToken [as next] (node_modules/@babel/parser/src/tokenizer/index.ts:121:10)
      at JSXParserMixin.next [as parseCoverCallAndAsyncArrowHead] (node_modules/@babel/parser/src/parser/expression.ts:888:10)
      at JSXParserMixin.parseCoverCallAndAsyncArrowHead [as parseSubscript] (node_modules/@babel/parser/src/parser/expression.ts:790:19)    
      at JSXParserMixin.parseSubscript [as parseSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:749:19)
      at JSXParserMixin.parseSubscripts [as parseExprSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:734:17)
      at JSXParserMixin.parseExprSubscripts [as parseUpdate] (node_modules/@babel/parser/src/parser/expression.ts:707:21)
      at JSXParserMixin.parseUpdate [as parseMaybeUnary] (node_modules/@babel/parser/src/parser/expression.ts:669:23)
      at JSXParserMixin.parseMaybeUnary [as parseMaybeUnaryOrPrivate] (node_modules/@babel/parser/src/parser/expression.ts:403:14)
      at JSXParserMixin.parseMaybeUnaryOrPrivate [as parseExprOps] (node_modules/@babel/parser/src/parser/expression.ts:415:23)
      at JSXParserMixin.parseExprOps [as parseMaybeConditional] (node_modules/@babel/parser/src/parser/expression.ts:370:23)
      at JSXParserMixin.parseMaybeConditional [as parseMaybeAssign] (node_modules/@babel/parser/src/parser/expression.ts:301:21)
      at JSXParserMixin.parseMaybeAssign [as parseExpressionBase] (node_modules/@babel/parser/src/parser/expression.ts:226:23)
      at parseExpressionBase (node_modules/@babel/parser/src/parser/expression.ts:217:39)
      at JSXParserMixin.callback [as allowInAnd] (node_modules/@babel/parser/src/parser/expression.ts:3144:16)
      at JSXParserMixin.allowInAnd [as parseExpression] (node_modules/@babel/parser/src/parser/expression.ts:217:17)
      at JSXParserMixin.parseExpression [as parseStatementContent] (node_modules/@babel/parser/src/parser/statement.ts:675:23)
      at JSXParserMixin.parseStatementContent [as parseStatementLike] (node_modules/@babel/parser/src/parser/statement.ts:468:17)
      at JSXParserMixin.parseStatementLike [as parseModuleItem] (node_modules/@babel/parser/src/parser/statement.ts:405:17)
      at JSXParserMixin.parseModuleItem [as parseBlockOrModuleBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1434:16)       
      at JSXParserMixin.parseBlockOrModuleBlockBody [as parseBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1408:10)        
      at JSXParserMixin.parseBlockBody [as parseProgram] (node_modules/@babel/parser/src/parser/statement.ts:225:10)
      at JSXParserMixin.parseProgram [as parseTopLevel] (node_modules/@babel/parser/src/parser/statement.ts:203:25)
      at JSXParserMixin.parseTopLevel [as parse] (node_modules/@babel/parser/src/parser/index.ts:93:10)
      at parse (node_modules/@babel/parser/src/index.ts:92:38)
      at parser (node_modules/@babel/core/src/parser/index.ts:28:19)
          at parser.next (<anonymous>)
      at normalizeFile (node_modules/@babel/core/src/transformation/normalize-file.ts:49:24)
          at normalizeFile.next (<anonymous>)
      at run (node_modules/@babel/core/src/transformation/index.ts:40:36)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/src/transform.ts:29:20)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at fn (node_modules/@babel/core/src/errors/rewrite-stack-trace.ts:99:14)
      at transformSync (node_modules/@babel/core/src/transform.ts:66:52)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

 FAIL  src/tests/integration/training.api.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @data/connection mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\data\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@data\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\data\$1"
      },
      "resolver": undefined
    }

      11 | const morgan = require('morgan');
      12 | const http = require('http');
    > 13 | const { connectDB } = require('@data/connection');
         |                       ^
      14 | const apiRoutes = require('@api/routes');
      15 | const swaggerRoutes = require('@api/swagger');
      16 | const { trainingRoutes } = require('@modules/training');

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (src/app.js:13:23)
      at Object.require (src/tests/integration/training.api.test.js:9:1)

 FAIL  src/tests/integration/personality.api.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @data/connection mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\data\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@data\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\data\$1"
      },
      "resolver": undefined
    }

      11 | const morgan = require('morgan');
      12 | const http = require('http');
    > 13 | const { connectDB } = require('@data/connection');
         |                       ^
      14 | const apiRoutes = require('@api/routes');
      15 | const swaggerRoutes = require('@api/swagger');
      16 | const { trainingRoutes } = require('@modules/training');

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (src/app.js:13:23)
      at Object.require (src/tests/integration/personality.api.test.js:9:1)

 FAIL  src/tests/integration/auth-flow-integration.test.js
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option. 

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    SyntaxError: C:\Users\ajelacn\Documents\chatbots\src\tests\integration\auth-flow-integration.test.js: Bad character escape sequence. (11:22)

       9 | const request = require('supertest');
      10 | require('@src/app');
    > 11 | require('@src/models\user.model');
         |                       ^
      12 | const jwt = require('jsonwebtoken');
      13 | require('@src/config');
      14 |

      at constructor (node_modules/@babel/parser/src/parse-error.ts:95:45)
      at JSXParserMixin.toParseError [as raise] (node_modules/@babel/parser/src/tokenizer/index.ts:1503:19)
      at Object.raise [as invalidEscapeSequence] (node_modules/@babel/parser/src/tokenizer/index.ts:1576:12)
      at invalidEscapeSequence (node_modules/@babel/babel-helper-string-parser/src/index.ts:293:14)
      at readHexChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:449:22)
      at readCodePoint (node_modules/@babel/babel-helper-string-parser/src/index.ts:191:24)
      at readEscapedChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:80:19)
      at JSXParserMixin.readStringContents [as readString] (node_modules/@babel/parser/src/tokenizer/index.ts:1336:46)
      at JSXParserMixin.readString (node_modules/@babel/parser/src/tokenizer/index.ts:991:14)
      at JSXParserMixin.getTokenFromCode (node_modules/@babel/parser/src/plugins/jsx/index.ts:631:13)
      at JSXParserMixin.getTokenFromCode [as nextToken] (node_modules/@babel/parser/src/tokenizer/index.ts:278:10)
      at JSXParserMixin.nextToken [as next] (node_modules/@babel/parser/src/tokenizer/index.ts:121:10)
      at JSXParserMixin.next [as parseCoverCallAndAsyncArrowHead] (node_modules/@babel/parser/src/parser/expression.ts:888:10)
      at JSXParserMixin.parseCoverCallAndAsyncArrowHead [as parseSubscript] (node_modules/@babel/parser/src/parser/expression.ts:790:19)    
      at JSXParserMixin.parseSubscript [as parseSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:749:19)
      at JSXParserMixin.parseSubscripts [as parseExprSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:734:17)
      at JSXParserMixin.parseExprSubscripts [as parseUpdate] (node_modules/@babel/parser/src/parser/expression.ts:707:21)
      at JSXParserMixin.parseUpdate [as parseMaybeUnary] (node_modules/@babel/parser/src/parser/expression.ts:669:23)
      at JSXParserMixin.parseMaybeUnary [as parseMaybeUnaryOrPrivate] (node_modules/@babel/parser/src/parser/expression.ts:403:14)
      at JSXParserMixin.parseMaybeUnaryOrPrivate [as parseExprOps] (node_modules/@babel/parser/src/parser/expression.ts:415:23)
      at JSXParserMixin.parseExprOps [as parseMaybeConditional] (node_modules/@babel/parser/src/parser/expression.ts:370:23)
      at JSXParserMixin.parseMaybeConditional [as parseMaybeAssign] (node_modules/@babel/parser/src/parser/expression.ts:301:21)
      at JSXParserMixin.parseMaybeAssign [as parseExpressionBase] (node_modules/@babel/parser/src/parser/expression.ts:226:23)
      at parseExpressionBase (node_modules/@babel/parser/src/parser/expression.ts:217:39)
      at JSXParserMixin.callback [as allowInAnd] (node_modules/@babel/parser/src/parser/expression.ts:3144:16)
      at JSXParserMixin.allowInAnd [as parseExpression] (node_modules/@babel/parser/src/parser/expression.ts:217:17)
      at JSXParserMixin.parseExpression [as parseStatementContent] (node_modules/@babel/parser/src/parser/statement.ts:675:23)
      at JSXParserMixin.parseStatementContent [as parseStatementLike] (node_modules/@babel/parser/src/parser/statement.ts:468:17)
      at JSXParserMixin.parseStatementLike [as parseModuleItem] (node_modules/@babel/parser/src/parser/statement.ts:405:17)
      at JSXParserMixin.parseModuleItem [as parseBlockOrModuleBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1434:16)       
      at JSXParserMixin.parseBlockOrModuleBlockBody [as parseBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1408:10)
      at JSXParserMixin.parseBlockBody [as parseProgram] (node_modules/@babel/parser/src/parser/statement.ts:225:10)
      at JSXParserMixin.parseProgram [as parseTopLevel] (node_modules/@babel/parser/src/parser/statement.ts:203:25)
      at JSXParserMixin.parseTopLevel [as parse] (node_modules/@babel/parser/src/parser/index.ts:93:10)
      at parse (node_modules/@babel/parser/src/index.ts:92:38)
      at parser (node_modules/@babel/core/src/parser/index.ts:28:19)
          at parser.next (<anonymous>)
      at normalizeFile (node_modules/@babel/core/src/transformation/normalize-file.ts:49:24)
          at normalizeFile.next (<anonymous>)
      at run (node_modules/@babel/core/src/transformation/index.ts:40:36)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/src/transform.ts:29:20)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at fn (node_modules/@babel/core/src/errors/rewrite-stack-trace.ts:99:14)
      at transformSync (node_modules/@babel/core/src/transform.ts:66:52)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

 FAIL  src/tests/integration/chatbot-conversation-flow.test.js
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option. 

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    SyntaxError: C:\Users\ajelacn\Documents\chatbots\src\tests\integration\chatbot-conversation-flow.test.js: Bad character escape sequence. (12:22)

      10 | const request = require('supertest');
      11 | require('@src/app');
    > 12 | require('@src/models\user.model');
         |                       ^
      13 | require('@src/models\chatbot.model');
      14 | require('@src/models\conversation.model');
      15 | require('@src/models\analytics.model');

      at constructor (node_modules/@babel/parser/src/parse-error.ts:95:45)
      at JSXParserMixin.toParseError [as raise] (node_modules/@babel/parser/src/tokenizer/index.ts:1503:19)
      at Object.raise [as invalidEscapeSequence] (node_modules/@babel/parser/src/tokenizer/index.ts:1576:12)
      at invalidEscapeSequence (node_modules/@babel/babel-helper-string-parser/src/index.ts:293:14)
      at readHexChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:449:22)
      at readCodePoint (node_modules/@babel/babel-helper-string-parser/src/index.ts:191:24)
      at readEscapedChar (node_modules/@babel/babel-helper-string-parser/src/index.ts:80:19)
      at JSXParserMixin.readStringContents [as readString] (node_modules/@babel/parser/src/tokenizer/index.ts:1336:46)
      at JSXParserMixin.readString (node_modules/@babel/parser/src/tokenizer/index.ts:991:14)
      at JSXParserMixin.getTokenFromCode (node_modules/@babel/parser/src/plugins/jsx/index.ts:631:13)
      at JSXParserMixin.getTokenFromCode [as nextToken] (node_modules/@babel/parser/src/tokenizer/index.ts:278:10)
      at JSXParserMixin.nextToken [as next] (node_modules/@babel/parser/src/tokenizer/index.ts:121:10)
      at JSXParserMixin.next [as parseCoverCallAndAsyncArrowHead] (node_modules/@babel/parser/src/parser/expression.ts:888:10)
      at JSXParserMixin.parseCoverCallAndAsyncArrowHead [as parseSubscript] (node_modules/@babel/parser/src/parser/expression.ts:790:19)
      at JSXParserMixin.parseSubscript [as parseSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:749:19)
      at JSXParserMixin.parseSubscripts [as parseExprSubscripts] (node_modules/@babel/parser/src/parser/expression.ts:734:17)
      at JSXParserMixin.parseExprSubscripts [as parseUpdate] (node_modules/@babel/parser/src/parser/expression.ts:707:21)
      at JSXParserMixin.parseUpdate [as parseMaybeUnary] (node_modules/@babel/parser/src/parser/expression.ts:669:23)
      at JSXParserMixin.parseMaybeUnary [as parseMaybeUnaryOrPrivate] (node_modules/@babel/parser/src/parser/expression.ts:403:14)
      at JSXParserMixin.parseMaybeUnaryOrPrivate [as parseExprOps] (node_modules/@babel/parser/src/parser/expression.ts:415:23)
      at JSXParserMixin.parseExprOps [as parseMaybeConditional] (node_modules/@babel/parser/src/parser/expression.ts:370:23)
      at JSXParserMixin.parseMaybeConditional [as parseMaybeAssign] (node_modules/@babel/parser/src/parser/expression.ts:301:21)
      at JSXParserMixin.parseMaybeAssign [as parseExpressionBase] (node_modules/@babel/parser/src/parser/expression.ts:226:23)
      at parseExpressionBase (node_modules/@babel/parser/src/parser/expression.ts:217:39)
      at JSXParserMixin.callback [as allowInAnd] (node_modules/@babel/parser/src/parser/expression.ts:3144:16)
      at JSXParserMixin.allowInAnd [as parseExpression] (node_modules/@babel/parser/src/parser/expression.ts:217:17)
      at JSXParserMixin.parseExpression [as parseStatementContent] (node_modules/@babel/parser/src/parser/statement.ts:675:23)
      at JSXParserMixin.parseStatementContent [as parseStatementLike] (node_modules/@babel/parser/src/parser/statement.ts:468:17)
      at JSXParserMixin.parseStatementLike [as parseModuleItem] (node_modules/@babel/parser/src/parser/statement.ts:405:17)
      at JSXParserMixin.parseModuleItem [as parseBlockOrModuleBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1434:16)       
      at JSXParserMixin.parseBlockOrModuleBlockBody [as parseBlockBody] (node_modules/@babel/parser/src/parser/statement.ts:1408:10)        
      at JSXParserMixin.parseBlockBody [as parseProgram] (node_modules/@babel/parser/src/parser/statement.ts:225:10)
      at JSXParserMixin.parseProgram [as parseTopLevel] (node_modules/@babel/parser/src/parser/statement.ts:203:25)
      at JSXParserMixin.parseTopLevel [as parse] (node_modules/@babel/parser/src/parser/index.ts:93:10)
      at parse (node_modules/@babel/parser/src/index.ts:92:38)
      at parser (node_modules/@babel/core/src/parser/index.ts:28:19)
          at parser.next (<anonymous>)
      at normalizeFile (node_modules/@babel/core/src/transformation/normalize-file.ts:49:24)
          at normalizeFile.next (<anonymous>)
      at run (node_modules/@babel/core/src/transformation/index.ts:40:36)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/src/transform.ts:29:20)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at fn (node_modules/@babel/core/src/errors/rewrite-stack-trace.ts:99:14)
      at transformSync (node_modules/@babel/core/src/transform.ts:66:52)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

 FAIL  src/tests/integration/chatbot-service-integration.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @data/connection mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\data\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@data\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\data\$1"
      },
      "resolver": undefined
    }

      11 | const morgan = require('morgan');
      12 | const http = require('http');
    > 13 | const { connectDB } = require('@data/connection');
         |                       ^
      14 | const apiRoutes = require('@api/routes');
      15 | const swaggerRoutes = require('@api/swagger');
      16 | const { trainingRoutes } = require('@modules/training');

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (src/app.js:13:23)
      at Object.require (src/tests/integration/chatbot-service-integration.test.js:10:1)

 FAIL  src/tests/integration/chatbot.api.test.js
  ● Test suite failed to run

    outes' from 'src/index.js'pi

    Require stack:
      src/index.js
      src/tests/integration/chatbot.api.test.js

      12 | // Import core modules
      13 | require('@src/config');
    > 14 | require('@src/api\routes');
         | ^
      15 | require('@src/middleware');
      16 | require('@src/utils');
      17 | require('@src/services\chatbot.service');

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (src/index.js:14:1)
      at Object.require (src/tests/integration/chatbot.api.test.js:10:1)

 FAIL  tests/utils/audio-processor.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/utilsaudio-processor mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

       7 | const path = require('path');
       8 | const fs = require('fs');
    >  9 | require('@src/utils\audio-processor');
         | ^
      10 |
      11 | // Create test directory if it doesn't exist
      12 | const testDir = path.join(process.cwd(), 'tests', 'temp');

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/utils/audio-processor.test.js:9:1)

 FAIL  tests/utils/model-manager.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/utilsmodel-manager mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

       7 | const path = require('path');
       8 | const fs = require('fs');
    >  9 | require('@src/utils\model-manager');
         | ^
      10 |
      11 | // Mock data for testing
      12 | const mockModelRegistry = {

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/utils/model-manager.test.js:9:1)

 FAIL  tests/utils/language-detector.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/utilslanguage-detector mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.
    
    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

       5 |  */
       6 |
    >  7 | require('@src/utils\language-detector');
         | ^
       8 |
       9 | describe('Language Detector', () => {
      10 |   beforeAll(async () => {

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/utils/language-detector.test.js:7:1)

 FAIL  tests/unit/conversation.service.test.js
  ● Test suite failed to run

    Cannot find module '../../utils' from 'tests/unit/conversation.service.test.js'

      11 |
      12 | // Mock logger to prevent console output during tests
    > 13 | jest.mock('../../utils', () => ({
         |      ^
      14 |   logger: {
      15 |     debug: jest.fn(),
      16 |     info: jest.fn(),

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/conversation.service.test.js:13:6)

 FAIL  tests/services/voice-recognition.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/services
oice-recognition.service mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

       7 | const path = require('path');
       8 | const fs = require('fs');
    >  9 | require('@src/services\voice-recognition.service');
         | ^
      10 |
      11 | // Create test directory if it doesn't exist
      12 | const testDir = path.join(process.cwd(), 'tests', 'temp');

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/services/voice-recognition.test.js:9:1)

 FAIL  tests/unit/app.test.js
  ● Test suite failed to run

    Cannot find module '../../../database/db.connection' from 'tests/unit/app.test.js'

      28 | }));
      29 |
    > 30 | jest.mock('../../../database/db.connection', () => ({
         |      ^
      31 |   connectDB: jest.fn().mockResolvedValue(true)
      32 | }));
      33 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/unit/app.test.js:30:6)

 FAIL  tests/integration/training.api.test.js
  ● Test suite failed to run

    Cannot find module '../../app' from 'tests/integration/training.api.test.js'

       7 | const request = require('supertest');
       8 | const mongoose = require('mongoose');
    >  9 | const app = require('../../app');
         |             ^
      10 | const TrainingDataset = require('../../database/schemas/training.schema');
      11 | const Chatbot = require('../../database/schemas/chatbot.schema');
      12 | const { connectDB, disconnectDB } = require('../../database/connection');

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/integration/training.api.test.js:9:13)

 FAIL  tests/integration/personality.api.test.js
  ● Test suite failed to run

    Cannot find module '../../app' from 'tests/integration/personality.api.test.js'

       7 | const request = require('supertest');
       8 | const mongoose = require('mongoose');
    >  9 | const app = require('../../app');
         |             ^
      10 | const Personality = require('../../database/schemas/personality.schema');
      11 | const Chatbot = require('../../database/schemas/chatbot.schema');
      12 | const { connectDB, disconnectDB } = require('../../database/connection');

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/integration/personality.api.test.js:9:13)

 FAIL  tests/integration/chatbot.api.test.js
  ● Test suite failed to run

    Cannot find module '../../services/chatbot.service' from 'tests/integration/chatbot.api.test.js'

      13 |
      14 | // Mock the chatbot service to avoid external dependencies
    > 15 | jest.mock('../../services/chatbot.service', () => ({
         |      ^
      16 |   initialize: jest.fn().mockResolvedValue(true),
      17 |   createChatbot: jest.fn(),
      18 |   getAllChatbots: jest.fn(),

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/integration/chatbot.api.test.js:15:6)

 FAIL  tests/integration/chatbot-service-integration.test.js
  ● Test suite failed to run

    Cannot find module '../../storage/storage.service' from 'tests/integration/chatbot-service-integration.test.js'

      14 |
      15 | // Mock storage service
    > 16 | jest.mock('../../storage/storage.service', () => ({
         |      ^
      17 |   storageService: {
      18 |     initialize: jest.fn().mockResolvedValue(true),
      19 |     storeFile: jest.fn().mockResolvedValue({

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (tests/integration/chatbot-service-integration.test.js:16:6)

 FAIL  tests/acceptance/voice-interface.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/utilsaudio-processor mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

      12 |
      13 | // Import voice components
    > 14 | require('@src/utils\audio-processor');
         | ^
      15 | require('@src/utils\language-detector');
      16 | require('@src/utils\model-manager');
      17 | require('@src/services\voice-recognition.service');

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/acceptance/voice-interface.test.js:14:1)

 FAIL  tests/integration/chatbot-conversation-flow.test.js
  ● Test suite failed to run

    Cannot find module '../../app' from 'tests/integration/chatbot-conversation-flow.test.js'

       9 | const { MongoMemoryServer } = require('mongodb-memory-server');
      10 | const request = require('supertest');
    > 11 | const app = require('../../app');
         |             ^
      12 | const User = require('../../models/user.model');
      13 | const Chatbot = require('../../models/chatbot.model');
      14 | const Conversation = require('../../models/conversation.model');

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/integration/chatbot-conversation-flow.test.js:11:13)

 FAIL  tests/integration/auth-flow-integration.test.js
  ● Test suite failed to run

    Cannot find module '../../app' from 'tests/integration/auth-flow-integration.test.js'

       8 | const { MongoMemoryServer } = require('mongodb-memory-server');
       9 | const request = require('supertest');
    > 10 | const app = require('../../app');
         |             ^
      11 | const User = require('../../models/user.model');
      12 | const jwt = require('jsonwebtoken');
      13 | const config = require('../../config');

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.require (tests/integration/auth-flow-integration.test.js:10:13)

 FAIL  tests/controllers/language-detector.controller.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/controllerslanguage-detector.controller mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

       7 | const request = require('supertest');
       8 | const express = require('express');
    >  9 | require('@src/controllers\language-detector.controller');
         | ^
      10 | require('@src/utils\language-detector');
      11 |
      12 | // Mock language detector

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/controllers/language-detector.controller.test.js:9:1)

 FAIL  tests/controllers/audio-processor.controller.test.js
  ● Test suite failed to run

    Configuration error:

    Could not locate module @src/controllersaudio-processor.controller mapped as:
    C:\Users\ajelacn\Documents\chatbots\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@src\/(.*)$/": "C:\Users\ajelacn\Documents\chatbots\src\$1"
      },
      "resolver": undefined
    }

      10 | const express = require('express');
      11 | const multer = require('multer');
    > 12 | require('@src/controllers\audio-processor.controller');
         | ^
      13 | require('@src/utils\audio-processor');
      14 |
      15 | // Mock audio processor

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (tests/controllers/audio-processor.controller.test.js:12:1)


Test Suites: 101 failed, 2 passed, 103 total
Tests:       18 failed, 15 passed, 33 total
Snapshots:   0 total
Time:        304.668 s
Ran all test suites.
(node:11768) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)

Jest has detected the following 2 open handles potentially keeping Jest from exiting:

  ●  Timeout

      89 |     const cleanupInterval = 3600000; // 1 hour
      90 |
    > 91 |     setInterval(() => {
         |     ^
      92 |       this.cleanupTempFiles();
      93 |     }, cleanupInterval);
      94 |   }

      at VoiceService.setInterval [as scheduleCleanup] (src/services/voice.service.js:91:5)
      at new scheduleCleanup (src/services/voice.service.js:64:10)
      at Object.<anonymous> (src/services/voice.service.js:561:18)
      at Object.require (tests/unit/services/voice.service.test.js:5:22)


  ●  Timeout

      89 |     const cleanupInterval = 3600000; // 1 hour
      90 |
    > 91 |     setInterval(() => {
         |     ^
      92 |       this.cleanupTempFiles();
      93 |     }, cleanupInterval);
      94 |   }

      at VoiceService.setInterval [as scheduleCleanup] (src/services/voice.service.js:91:5)
      at new scheduleCleanup (src/services/voice.service.js:64:10)
      at Object.<anonymous> (src/services/voice.service.js:561:18)
      at Object.require (src/tests/unit/services/voice.service.test.js:5:1)

PS C:\Users\ajelacn\Documents\chatbots> 