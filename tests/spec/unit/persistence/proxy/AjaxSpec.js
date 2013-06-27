/*global define, window, jQuery, _, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'lodash',
	'Class',
	'data/Model',
	'data/persistence/ResultSet',
	'data/persistence/proxy/Ajax',
	'data/persistence/reader/Reader',
	'data/persistence/operation/Read',
	'data/persistence/operation/Write'
], function( _, Class, Model, ResultSet, AjaxProxy, Reader, ReadOperation, WriteOperation ) {
	
	// Used in the tests
	var ConcreteReader = Reader.extend( {
		convertRaw : function( rawData ) { return rawData; }
	} );
	
	
	describe( 'data.persistence.proxy.Ajax', function() {
		
		describe( 'read()', function() {
			var reader,
			    operation;
			
			beforeEach( function() {
				reader = new ConcreteReader();
				operation = new ReadOperation();
			} );
			
			
			it( "should call the ajax function with the correct url when a single model is being loaded", function() {
				spyOn( operation, 'getModelId' ).andReturn( 1 );
				
				var providedUrl,
				    providedData;  // this will be the params string in the case of 'read'
				
				var testData = { attribute1: 'value1', attribute2: 'value2' };
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
				proxy.read( operation );
				expect( providedUrl ).toBe( '/testUrl' );
				expect( providedData ).toBe( 'id=1' );
			} );
			
			
			it( "should populate the provided ReadOperation with a ResultSet upon a successful ajax request", function() {
				var resultSet;

				spyOn( operation, 'getModelId' ).andReturn( 1 );
				spyOn( operation, 'setResultSet' ).andCallThrough();
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
				proxy.read( operation );
				
				expect( testData ).toBe( resultSet.getRecords()[ 0 ] );  // orig YUI Test err msg: "The records provided to the ResultSet should have been the testData"
				
				expect( operation.setResultSet ).toHaveBeenCalledWith( resultSet );
			} );
			
		} );
		
		
		describe( 'buildUrl()', function() {
			
			it( "should return the configured `url` for the Proxy", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl'
				} );
				var operation = new ReadOperation();
				
				expect( proxy.buildUrl( 'read', operation ) ).toBe( '/testUrl' );
			} );
			
			
			it( "should only append parameters to the url for create/update/destroy operations, as parameters for 'read' are handled differently in the read() method", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					
					defaultParams : {
						param1: "value1",
						param2: "value2"
					}
				} );
				
				var readOperation = new ReadOperation();
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl' );
				
				var writeOperation = new WriteOperation();
				expect( proxy.buildUrl( 'update', writeOperation ) ).toBe( '/testUrl?param1=value1&param2=value2' );
			} );
			
			
			it( "should only append parameters to the url for create/update/destroy operations, as parameters for 'read' are handled differently in the read() method (not even calling the serializeParams method)", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					
					defaultParams : {
						param1: "value1",
						param2: "value2"
					},
					
					// Overridden serialize method, that always returns something. There was an issue where the code used to create
					// an empty object for the params on a 'read' operation, but they were still being serialized as something when 
					// serializeParams() was overridden. This fact was missed in a previous test, because the default serializeParams() 
					// returns empty string if passed an empty object of params.
					serializeParams : function() { return "asdf"; }
				} );
				
				var readOperation = new ReadOperation();
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl' );
				
				var writeOperation = new WriteOperation();
				expect( proxy.buildUrl( 'update', writeOperation ) ).toBe( '/testUrl?asdf' );
			} );
			
		} );
		
		
		describe( 'buildParams()', function() {
				
			it( "should return the id param if a `modelId` is set on the ReadOperation", function() {
				var proxy = new AjaxProxy(),
				    operation = new ReadOperation( { modelId: 1 } );
				
				expect( proxy.buildParams( 'read', operation ) ).toEqual( { id: 1 } );
			} );
			
			
			it( "should return any params passed on the Operation, as well as the `modelId` set on a ReadOperation", function() {
				var proxy = new AjaxProxy();
				var readOperation = new ReadOperation( {
					modelId : 1,
					params : {
						param1: "value1",
						param2: 2
					}
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {
					id: 1,
					param1: "value1",
					param2: 2
				} );
				
				
				var writeOperation = new WriteOperation( { 
					params : {
						param1: "value1",
						param2: 2
					}
				} );
				expect( proxy.buildParams( 'update', writeOperation ) ).toEqual( {
					param1: "value1",
					param2: 2
				} );
			} );
			
			
			it( "should return configured defaultParams + any params passed on the Operation, where params on the Operation override defaultParams of the same name", function() {
				var proxy = new AjaxProxy( {
					defaultParams : {
						param1: "value1",
						param2: "value2"
					}
				});
				
				var readOperation = new ReadOperation( { 
					modelId: 1,
					params : {
						param1: "overridden_value1",
						param3: "value3"
					}
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {
					id     : 1,
					param1 : "overridden_value1",
					param2 : "value2",
					param3 : "value3"
				} );
				
				
				var writeOperation = new WriteOperation( { 
					params : {
						param1: "overridden_value1",
						param3: "value3"
					}
				} );
				expect( proxy.buildParams( 'update', writeOperation ) ).toEqual( {
					param1 : "overridden_value1",
					param2 : "value2",
					param3 : "value3"
				} );
			} );
			
			
			it( "should add the `pageParam` if it is configured, and a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum'
				} );
				
				var readOperation = new ReadOperation( { 
					page : 5
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {
					pageNum : 5
				} );
			} );
			
			
			it( "should *not* add the `pageParam` if it is configured, but a page of data to load is not provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum'
				} );
				
				var readOperation = new ReadOperation( { 
					//page : 0   -- no page configured
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {} );
			} );
			
			
			it( "should *not* add the `pageParam` if it is *not* configured, even if a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					//pageParam : 'pageNum'  -- not configured
				} );
				
				var readOperation = new ReadOperation( { 
					page : 5
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {} );
			} );
			
			
			it( "should add the `pageSizeParam` if it is configured, and a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum',
					pageSizeParam : 'pageSize'
				} );
				
				var readOperation = new ReadOperation( { 
					page  : 5,
					pageSize : 50
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {
					pageNum  : 5,
					pageSize : 50
				} );
			} );
			
			
			it( "should add the `pageSizeParam` if it is configured, regardless of if a *page* of data to load is provided or not on the ReadOperation (which may be used to limit the number of records alone)", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum',
					pageSizeParam : 'pageSize'
				} );
				
				var readOperation = new ReadOperation( { 
					//page : 0   -- no page configured
					pageSize : 50
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {
					pageSize : 50
				} );
			} );
			
			
			it( "should *not* add the `pageSizeParam` if it is *not* configured, even if a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					pageParam : 'pageNum'
					//pageSizeParam : 'pageSize'  -- not configured,
				} );
				
				var readOperation = new ReadOperation( { 
					page : 5,
					pageSize : 50
				} );
				expect( proxy.buildParams( 'read', readOperation ) ).toEqual( {
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