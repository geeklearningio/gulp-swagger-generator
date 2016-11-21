# gulp-swagger-generator

Customized version

Gulp code generator for Swagger 2.0. This package generates your api clients using handlebars templates.

*This project is still under development and you can expect big changes especially around seperation of concerns, generation model or extensibility. The documentation will be improved shortly.*

At the moment it comes with the following builtin templates :

* typescript-angular (client for angular using typescript, depends on $http)
* csharp-portable (client for portable library integration, depends on HttpClient and Newtonsoft.Json)
* csharp-unity (client for unity, depends on Newtonsoft.Json and requires latest CLR version available)

## How to use it

Let's state you have a swagger file `api-swagger.json` at your disposal.

You can generate your client using a gulp task such as:
```javascript
var gulp = require("gulp"),
    path = require("path"),
    swaggerGenerator = require('gulp-swagger-generator'),
    rename = require("gulp-rename");
 
gulp.task('swagger:generate', function () {
    return gulp.src('./api-swagger.json')
        .pipe(swaggerGenerator({
            clientName: 'ServiceClient',
            templateOptions: {
                module: "Sample",
                scheme: 'http',
            },
            template: "typescript-angular",
            singleFile: true
        }))
        .pipe(rename("serviceClient.ts"))
        .pipe(gulp.dest("./src/app/services/"));
});
```

## Typescript template

### Inject dependencies
```javascript
You can add any dependency you might require to the client Constructor using inject option.

templateOptions: {
    inject: [{
        name: 'authenticationService',
        type: 'any'
    }, {
        name: 'ENV_API_HOSTNAME',
        type: string
    }]
}
```

### Host
You can set the host to an injected value using host.set :

```javascript
templateOptions: {
    host: {
        set: 'ENV_API_HOSTNAME',
    }
}
```

### Interface and mocks
You can generate an interface and mocks.

```javascript
templateOptions: {
    generateInterface: true,
    generateMock : true
}
```

### Authentication
At the moment you can configure authentication settings for each request using an injected service. Then you will set which method of that service should be called to configure a request for a given swagger security definition :

```javascript
templateOptions: {
    secuerity: {
        Bearer: {
            configure: 'authenticateService.configureRequest'
        }
    }
}
```

### Arguments
By default argument are sorted by mandatory/optional then by alphabetical order (this will become more tunable in the future). This might not be robust when the api changes often and optional parameters order changes. You can switch to a mode where arguments are grouped into a literal so you will not face those issues.

```javascript
templateOptions: {
    arguments: {
        asInterface: true
    }
}
```
