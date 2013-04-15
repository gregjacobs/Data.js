/*global define, window, jQuery, _, describe, beforeEach, afterEach, it, expect, JsMockito */
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
	
	
	describe( "unit.persistence.proxy.Ajax", function() {
		
		describe( "Test read", function() {
			
			describe( "General read() tests", function() {
				var thisSuite;
				
				beforeEach( function() {
					thisSuite = {};
					
					thisSuite.model = JsMockito.mock( Model );
					thisSuite.reader = JsMockito.mock( ConcreteReader );
					thisSuite.operation = JsMockito.mock( ReadOperation );
				} );
				
				
				it( "read() should call the ajax function with the correct url when a single model is being loaded", function() {
					JsMockito.when( thisSuite.operation ).getModelId().thenReturn( 1 );
					var providedUrl;
					
					var testData = { attribute1: 'value1', attribute2: 'value2' };
					var TestProxy = AjaxProxy.extend( {
						ajax : function( options ) {
							providedUrl = options.url;
							return new jQuery.Deferred().promise();
						}
					} );
					
					var proxy = new TestProxy( {
						url : '/testUrl',
						idParam : 'id'
					} );
					proxy.read( thisSuite.operation );
					expect( providedUrl ).toBe( '/testUrl?id=1' );
				} );
				
				
				it( "read() should populate the provided ReadOperation with a ResultSet upon a successful ajax request", function() {
					var resultSet;
					
					JsMockito.when( thisSuite.operation ).getModelId().thenReturn( 1 );
					JsMockito.when( thisSuite.reader ).read().then( function( data ) {
						return ( resultSet = new ResultSet( { records: data } ) );
					} );
					
					var testData = { attribute1: 'value1', attribute2: 'value2' };
					
					var TestProxy = AjaxProxy.extend( {
						ajax : function( options ) {
							return new jQuery.Deferred().resolve( testData ).promise();
						},
						reader : thisSuite.reader
					} );
					
					var proxy = new TestProxy( {
						url : '/testUrl'
					} );
					proxy.read( thisSuite.operation );
					
					expect( testData ).toBe( resultSet.getRecords()[ 0 ] );  // orig YUI Test err msg: "The records provided to the ResultSet should have been the testData"
					
					JsMockito.verify( thisSuite.operation ).setResultSet( resultSet );
				} );
				
			} );
			
		} );
		
		
		describe( "Test buildUrl()", function() {
			
			it( "buildUrl() should simply return the base url if no modelId is set on the ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl'
				} );
				var operation = new ReadOperation();
				
				expect( proxy.buildUrl( 'read', operation ) ).toBe( '/testUrl' );
			} );
			
			
			it( "buildUrl() should return the base url + the id param if a modelId is set on the ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl'
				} );
				var operation = new ReadOperation( { modelId: 1 } );
				
				expect( proxy.buildUrl( 'read', operation ) ).toBe( '/testUrl?id=1' );
			} );
			
			
			it( "buildUrl() should return the base url + any params passed on the Operation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl'
				} );
				
				var readOperation = new ReadOperation( { 
					modelId: 1,
					params : {
						p1: "value1",
						p2: 2
					}
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl?p1=value1&p2=2&id=1' );
				
				var writeOperation = new WriteOperation( { 
					params : {
						p1: "value1",
						p2: 2
					}
				} );
				expect( proxy.buildUrl( 'update', writeOperation ) ).toBe( '/testUrl?p1=value1&p2=2' );
			} );
			
			
			it( "buildUrl() should return the base url + configured extraParams + any params passed on the Operation, where params on the Operation override extraParams of the same name", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					extraParams : {
						p1: "value1",
						p2: "value2"
					}
				} );
				
				var readOperation = new ReadOperation( { 
					modelId: 1,
					params : {
						p1: "overridden_value1",
						p3: "value3"
					}
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl?p1=overridden_value1&p2=value2&p3=value3&id=1' );
				
				var writeOperation = new WriteOperation( { 
					params : {
						p1: "overridden_value1",
						p3: "value3"
					}
				} );
				expect( proxy.buildUrl( 'update', writeOperation ) ).toBe( '/testUrl?p1=overridden_value1&p2=value2&p3=value3' );
			} );
			
			
			it( "buildUrl() should url encode both its extraParam and Operation-level params' values", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					extraParams : {
						p1: "a b"
					}
				} );
				
				var readOperation = new ReadOperation( { 
					modelId: 1,
					params : {
						p2: "a@b"
					}
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl?p1=a%20b&p2=a%40b&id=1' );
				
				var writeOperation = new WriteOperation( { 
					params : {
						p2: "a@b"
					}
				} );
				expect( proxy.buildUrl( 'update', writeOperation ) ).toBe( '/testUrl?p1=a%20b&p2=a%40b' );
			} );
			
			
			it( "buildUrl() should add the `pageParam` if it is configured, and a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					pageParam : 'pageNum'
				} );
				
				var readOperation = new ReadOperation( { 
					page : 5
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl?pageNum=5' );
			} );
			
			
			it( "buildUrl() should *not* add the `pageParam` if it is configured, but a page of data to load is not provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					pageParam : 'pageNum'
				} );
				
				var readOperation = new ReadOperation( { 
					//page : 0   -- no page configured
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl' );
			} );
			
			
			it( "buildUrl() should *not* add the `pageParam` if it is not configured, even if a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl'
					//pageParam : 'pageNum'  -- not configured
				} );
				
				var readOperation = new ReadOperation( { 
					page : 5
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl' );
			} );
			
			
			it( "buildUrl() should add the `pageSizeParam` if it is configured, and a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					pageParam : 'pageNum',
					pageSizeParam : 'pageSize'
				} );
				
				var readOperation = new ReadOperation( { 
					page  : 5,
					pageSize : 50
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl?pageNum=5&pageSize=50' );
			} );
			
			
			it( "buildUrl() should *not* add the `pageSizeParam` if it is configured, but a page of data to load is not provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					pageParam : 'pageNum',
					pageSizeParam : 'pageSize'
				} );
				
				var readOperation = new ReadOperation( { 
					//page : 0   -- no page configured
					pageSize : 50
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl' );
			} );
			
			
			it( "buildUrl() should *not* add the `pageSizeParam` if it is not configured, even if a page of data to load is provided on a ReadOperation", function() {
				var proxy = new AjaxProxy( {
					url : '/testUrl',
					pageParam : 'pageNum'
					//pageSizeParam : 'pageSize'  -- not configured,
				} );
				
				var readOperation = new ReadOperation( { 
					page : 5,
					pageSize : 50
				} );
				expect( proxy.buildUrl( 'read', readOperation ) ).toBe( '/testUrl?pageNum=5' );
			} );
			
		} );
		
	} );
} );