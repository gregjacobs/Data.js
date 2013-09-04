/*global define, window, jQuery, _, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/Ajax',
	'data/persistence/reader/Reader',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy'
], function( _, Class, Model, ResultSet, AjaxProxy, Reader, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest ) {
	
	// Used in the tests
	var ConcreteReader = Reader.extend( {
		convertRaw : function( rawData ) { return rawData; }
	} );
	
	
	describe( 'data.persistence.proxy.Ajax', function() {
		
		describe( 'read()', function() {
			var reader,
			    request;
			
			beforeEach( function() {
				reader = new ConcreteReader();
				request = new ReadRequest();
			} );
			
			
			it( "should call the ajax function with a url that includes an id param when a single model is being loaded", function() {
				spyOn( request, 'getModelId' ).andReturn( 1 );
				
				var providedUrl,
				    providedData;  // this will be the params string in the case of 'read'
				
				var TestProxy = AjaxProxy.extend( {
					ajax : function( options ) {
						providedUrl = options.url;
						providedData = options.data;
						return new jQuery.Deferred().promise();
					}
				} );
				
				var proxy = new TestProxy( {
					url : '/testUrl',
					idParam : 'id'
				} );
				proxy.read( request );
				expect( providedUrl ).toBe( '/testUrl' );
				expect( providedData ).toBe( 'id=1' );
			} );
			
			
			it( "should not add the id param if the `idParam` config is set to an empty string or other falsy value", function() {
				spyOn( request, 'getModelId' ).andReturn( 1 );
				
				var providedUrl,
				    providedData;  // this will be the params string in the case of 'read'
				
				var TestProxy = AjaxProxy.extend( {
					ajax : function( options ) {
						providedUrl = options.url;
						providedData = options.data;
						return new jQuery.Deferred().promise();
					}
				} );
				
				var proxy = new TestProxy( {
					url : '/testUrl',
					idParam : ''  // empty string
				} );
				proxy.read( request );
				expect( providedUrl ).toBe( '/testUrl' );
				expect( providedData ).toBe( '' );
			} );
			
			
			it( "should populate the provided ReadRequest with a ResultSet upon a successful ajax request", function() {
				var resultSet;

				spyOn( request, 'getModelId' ).andReturn( 1 );
				spyOn( request, 'setResultSet' ).andCallThrough();
				spyOn( reader, 'read' ).andCallFake( function( data ) {
					return ( resultSet = new ResultSet( { records: data } ) );
				} );
				
				var testData = { attribute1: 'value1', attribute2: 'value2' };
				
				var TestProxy = AjaxProxy.extend( {
					ajax : function( options ) {
						return new jQuery.Deferred().resolve( testData ).promise();
					},
					reader : reader
				} );
				
				var proxy = new TestProxy( {
					url : '/testUrl'
				} );
				proxy.read( request );
				
				expect( testData ).toBe( resultSet.getRecords()[ 0 ] );  // orig YUI Test err msg: "The records provided to the ResultSet should have been the testData"
				
				expect( request.setResultSet ).toHaveBeenCalledWith( resultSet );
			} );
			
		} );
		
		
		describe( 'buildUrl()', function() {
			
			it( "should return the configured `url` for the Proxy", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl'
				} );
				var request = new ReadRequest();
				
				expect( proxy.buildUrl( request ) ).toBe( '/testUrl' );
			} );
			
			
			it( "should only append parameters to the url for create/update/destroy requests, as parameters for 'read' are handled differently in the read() method", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					
					defaultParams : {
						param1: "value1",
						param2: "value2"
					}
				} );
				
				var readRequest = new ReadRequest();
				expect( proxy.buildUrl( readRequest ) ).toBe( '/testUrl' );
				
				// Check the Write requests
				var createRequest = new CreateRequest(),
				    updateRequest = new UpdateRequest(),
				    destroyRequest = new DestroyRequest();
				
				expect( proxy.buildUrl( createRequest ) ).toBe( '/testUrl?param1=value1&param2=value2' );
				expect( proxy.buildUrl( updateRequest ) ).toBe( '/testUrl?param1=value1&param2=value2' );
				expect( proxy.buildUrl( destroyRequest ) ).toBe( '/testUrl?param1=value1&param2=value2' );
			} );
			
			
			it( "should only append parameters to the url for create/update/destroy requests, as parameters for 'read' are handled differently in the read() method (not even calling the serializeParams method)", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					
					defaultParams : {
						param1: "value1",
						param2: "value2"
					},
					
					// Overridden serialize method, that always returns something. There was an issue where the code used to create
					// an empty object for the params on a 'read' request, but they were still being serialized as something when 
					// serializeParams() was overridden. This fact was missed in a previous test, because the default serializeParams() 
					// returns empty string if passed an empty object of params.
					serializeParams : function() { return "asdf"; }
				} );
				
				var readRequest = new ReadRequest();
				expect( proxy.buildUrl( readRequest ) ).toBe( '/testUrl' );
				
				// Check the Write requests
				var createRequest = new CreateRequest(),
				    updateRequest = new UpdateRequest(),
				    destroyRequest = new DestroyRequest();
				
				expect( proxy.buildUrl( createRequest ) ).toBe( '/testUrl?asdf' );
				expect( proxy.buildUrl( updateRequest ) ).toBe( '/testUrl?asdf' );
				expect( proxy.buildUrl( destroyRequest ) ).toBe( '/testUrl?asdf' );
			} );
			
		} );
		
		
		describe( 'buildParams()', function() {
				
			it( "should return the id param if a `modelId` is set on the ReadRequest", function() {
				var proxy = new AjaxProxy(),
				    request = new ReadRequest( { modelId: 1 } );
				
				expect( proxy.buildParams( 'read', request ) ).toEqual( { id: 1 } );
			} );
			
			
			it( "should return any params passed on the Request, as well as the `modelId` set on a ReadRequest", function() {
				var proxy = new AjaxProxy();
				
				// Check the Read request
				var readRequest = new ReadRequest( {
					modelId : 1,
					params : {
						param1: "value1",
						param2: 2
					}
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {
					id: 1,
					param1: "value1",
					param2: 2
				} );
				
				
				// Check the Write requests
				var inputParams = { param1: "value1", param2: 2 },
				    expectedParams = { param1: "value1", param2: 2 },
				    createRequest = new CreateRequest( { params: inputParams } ),
				    updateRequest = new UpdateRequest( { params: inputParams } ),
				    destroyRequest = new DestroyRequest( { params: inputParams } );
				
				expect( proxy.buildParams( 'create', createRequest ) ).toEqual( expectedParams );
				expect( proxy.buildParams( 'update', updateRequest ) ).toEqual( expectedParams );
				expect( proxy.buildParams( 'destroy', destroyRequest ) ).toEqual( expectedParams );
			} );
			
			
			it( "should return configured defaultParams + any params passed on the Request, where params on the Request override defaultParams of the same name", function() {
				var proxy = new AjaxProxy( {
					defaultParams : {
						param1: "value1",
						param2: "value2"
					}
				});
				
				// Check the Read request
				var readRequest = new ReadRequest( { 
					modelId: 1,
					params : {
						param1: "overridden_value1",
						param3: "value3"
					}
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {
					id     : 1,
					param1 : "overridden_value1",
					param2 : "value2",
					param3 : "value3"
				} );
				
				
				// Check the Write requests
				var inputParams = { param1: "overridden_value1", param3: "value3" },
				    expectedParams = { param1: "overridden_value1", param2: "value2", param3: "value3" },
				    createRequest = new CreateRequest( { params: inputParams } ),
				    updateRequest = new UpdateRequest( { params: inputParams } ),
				    destroyRequest = new DestroyRequest( { params: inputParams } );
				
				expect( proxy.buildParams( 'create', createRequest ) ).toEqual( expectedParams );
				expect( proxy.buildParams( 'update', updateRequest ) ).toEqual( expectedParams );
				expect( proxy.buildParams( 'destroy', destroyRequest ) ).toEqual( expectedParams );
			} );
			
			
			it( "should add the `pageParam` if it is configured, and a page of data to load is provided on a ReadRequest", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum'
				} );
				
				var readRequest = new ReadRequest( { 
					page : 5
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {
					pageNum : 5
				} );
			} );
			
			
			it( "should *not* add the `pageParam` if it is configured, but a page of data to load is not provided on a ReadRequest", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum'
				} );
				
				var readRequest = new ReadRequest( { 
					//page : 0   -- no page configured
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {} );
			} );
			
			
			it( "should *not* add the `pageParam` if it is *not* configured, even if a page of data to load is provided on a ReadRequest", function() {
				var proxy = new AjaxProxy( {
					//pageParam : 'pageNum'  -- not configured
				} );
				
				var readRequest = new ReadRequest( { 
					page : 5
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {} );
			} );
			
			
			it( "should add the `pageSizeParam` if it is configured, and a page of data to load is provided on a ReadRequest", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum',
					pageSizeParam : 'pageSize'
				} );
				
				var readRequest = new ReadRequest( { 
					page  : 5,
					pageSize : 50
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {
					pageNum  : 5,
					pageSize : 50
				} );
			} );
			
			
			it( "should add the `pageSizeParam` if it is configured, regardless of if a *page* of data to load is provided or not on the ReadRequest (which may be used to limit the number of records alone)", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum',
					pageSizeParam : 'pageSize'
				} );
				
				var readRequest = new ReadRequest( { 
					//page : 0   -- no page configured
					pageSize : 50
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {
					pageSize : 50
				} );
			} );
			
			
			it( "should *not* add the `pageSizeParam` if it is *not* configured, even if a page of data to load is provided on a ReadRequest", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum'
					//pageSizeParam : 'pageSize'  -- not configured,
				} );
				
				var readRequest = new ReadRequest( { 
					page : 5,
					pageSize : 50
				} );
				expect( proxy.buildParams( 'read', readRequest ) ).toEqual( {
					pageNum : 5
				} );
			} );
				
		} );
		
		
		describe( 'getHttpMethod()', function() {
			
			it( "should return the configured HTTP method for each of the four actions: create, read, update, destroy", function() {
				var proxy = new AjaxProxy( {
					createMethod  : 'POST',
					readMethod    : 'GET',
					updateMethod  : 'PUT',
					destroyMethod : 'DELETE'
				} );

				expect( proxy.getHttpMethod( 'create' ) ).toBe( 'POST' );
				expect( proxy.getHttpMethod( 'read' ) ).toBe( 'GET' );
				expect( proxy.getHttpMethod( 'update' ) ).toBe( 'PUT' );
				expect( proxy.getHttpMethod( 'destroy' ) ).toBe( 'DELETE' );
			} );
			
		} );
		
		
		// --------------------------------------
		
		
		describe( 'urlAppend()', function() {
			
			it( "should simply return the `baseUrl` arg if no `queryString` is provided", function() {
				var proxy = new AjaxProxy();

				expect( proxy.urlAppend( 'http://www.yahoo.com/' /* no second arg */ ) ).toBe( 'http://www.yahoo.com/' );
				expect( proxy.urlAppend( 'http://www.yahoo.com/', '' ) ).toBe( 'http://www.yahoo.com/' );
			} );
			
			
			it( "should append the `queryString` with a '?' as the separator character, if there is no '?' yet in the url", function() {
				var proxy = new AjaxProxy();
				
				var result = proxy.urlAppend( 'http://www.yahoo.com/', 'x=1&y=2' );
				expect( result ).toBe( 'http://www.yahoo.com/?x=1&y=2' );
			} );
			
			
			it( "should append the `queryString` with a '&' if there is already a '?' in the url string", function() {
				var proxy = new AjaxProxy();
				
				var result = proxy.urlAppend( 'http://www.yahoo.com/?x=1', 'y=2&z=3' );
				expect( result ).toBe( 'http://www.yahoo.com/?x=1&y=2&z=3' );
			} );
			
			
			it( "should handle the special case of a '?' being the last character in the `url`, by append the `queryString` with *no* separator character", function() {
				var proxy = new AjaxProxy();
				
				var result = proxy.urlAppend( 'http://www.yahoo.com/?', 'x=1&y=2' );
				expect( result ).toBe( 'http://www.yahoo.com/?x=1&y=2' );
			} );
			
			
			it( "should handle the special case of the url being an empty string, properly adding the '?' as the first character", function() {
				var proxy = new AjaxProxy();
				
				var result = proxy.urlAppend( '', 'x=1&y=2' );
				expect( result ).toBe( '?x=1&y=2' );
			} );
			
		} );
		
		
		describe( 'objToQueryString()', function() {
			var proxy;
			
			beforeEach( function() {
				proxy = new AjaxProxy();
			} );
			

			it( "should accept a map of simple key/value params, and convert them to a query string with the values URL encoded", function() {
				var params = {
					p1 : "a b",
					p2 : "a@b",
					p3 : "testing123"
				};
				
				expect( proxy.objToQueryString( params ) ).toBe( "p1=a%20b&p2=a%40b&p3=testing123" );
			} );
			
		} );
		
	} );
} );