require.config({
    paths: {
        jquery:    'lib/jquery/jquery'
    },

    packages:[{
        name:     'dojo',
        location: 'lib/dojo'
    },
    {
        name:     'dijit',
        location: 'lib/dijit'
    },
    {
        name:     'dojox',
        location: 'lib/dojox'
    },
    {
        name:     'jszlib',
        location: 'lib/jszlib'
    },
    {
        name:     'dgrid',
        location: 'lib/dgrid'
    },
    {
        name:     'xstyle',
        location: 'lib/xstyle'
    },
    {
        name:     'put-selector',
        location: 'lib/put-selector'
    },
    {
        name:     'FileSaver',
        location: 'lib/FileSaver'
    },
    {
        name:     'jDataView',
        location: 'lib/jDataView/src',
        main:     'jdataview'
    },
    {
        name:     'jqueryui',
        location: 'lib/jqueryui'
    }]
});

define(['JBrowse/Browser']
, function (Browser) {

    var config = {
        containerID: 'genome',
        baseUrl: 'data/jbrowse/',
        refSeqs: 'data/jbrowse/seq/refSeqs.json',
        include: ['data/jbrowse/trackList.json', 'data/jbrowse/edit-track.json', 'data/jbrowse/simple-track.json'],
        show_nav: false,
        show_tracklist: true,
        show_overview:  false,
        stores: {
            url: {
                type: "JBrowse/Store/SeqFeature/FromConfig",
                features: []
            }
        }
    };

    return ['$http', '$q', '$cookieStore', function (http, q, cookie) {
        this.browser = new Browser(config);

        this.sidebar_visible = true;
        this.toggle_sidebar  = function () {
            this.sidebar_visible = !this.sidebar_visible;
            var thisB = this.browser;
            setTimeout(function () {
                thisB.browserWidget.resize({w: $('#genome').width()});
            }, 0);
        };

        this.load = function (task) {
            this.browser.showRegion(task);
        };

        this.edits = function () {
            return this.browser._getPlugin('WebApollo').then(function (wa) {
                return wa.getAnnotTrack().store.features;
            });
        };

        this.clear_edits = function () {
            return this.browser._getPlugin('WebApollo').then(function (wa) {
                wa.getAnnotTrack().store.features = {};
            });
        };

        var browser = this.browser;
        browser.afterMilestone('completely initialized', function () {
            //browser.showRegion({start: 50, end: 6000, tracks: ['simple_feature']});
            browser.showTracks(['simple_feature']);
        });

        var jbrowse = this;

        var get = function () {
            return http.get('data/tasks/next')
            .then(function (response) {
                return response.data;
            })
            .then(function (task) {
                cookie.put('task', task);
                return task;
            });
        };

        var put = function (id, submission) {
            var data = JSON.stringify(submission);
            return http.post('data/tasks/' + id, data).then(function (response) {
                console.log('saved submission');
            });
            // what on failure?
        }

        this.done = function () {
            jbrowse.edits().then(function (annotation){
                var task = cookie.get('task');
                put(task.id, annotation)
                .then(function () {
                    $('#thanks').modal();
                });
            });
        }

        $('#thanks').on('hidden.bs.modal', function () {
            jbrowse.clear_edits()
            .then(get)
            .then(function (task) {
                jbrowse.load(task);
            });
        });

        // initialize
        q.when(cookie.get('task'))
        .then(function (task) {
            return task || get();
        })
        .then(function (task) {
            jbrowse.load(task);
        });
    }];
});
