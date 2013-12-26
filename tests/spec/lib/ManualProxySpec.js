/*global define, describe, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	
	'spec/lib/ManualProxy',
	
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy',
	
	'data/persistence/ResultSet'
], function( _, ManualProxy, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest, ResultSet ) {
	
	describe( 'spec.lib.ManualProxy', function() {
		
		var manualProxy;
		var requestClasses = {
			'create'  : CreateRequest,
			'read'    : ReadRequest,
			'update'  : UpdateRequest,
			'destroy' : DestroyRequest
		};
		
		beforeEach( function() {
			manualProxy = new ManualProxy();
		} );
		
		
		_.forEach( [ 'Create', 'Read', 'Update', 'Destroy' ], function( capitalizedActionName ) {
			var actionName = capitalizedActionName.toLowerCase(),
			    RequestClass = requestClasses[ actionName ];
		
			describe( "get" + capitalizedActionName + "Request()", function() {
				
				it( "should retrieve the '" + actionName + "' request at `requestNum`", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass();
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Check that the Requests can be retrieved back. 
					// Example call here: manualProxy.getCreateRequest( 0 )
					expect( manualProxy[ 'get' + capitalizedActionName + 'Request' ]( 0 ) ).toBe( request1 );
					expect( manualProxy[ 'get' + capitalizedActionName + 'Request' ]( 1 ) ).toBe( request2 );
				} );
				
			} );
			
			describe( "get" + capitalizedActionName + "RequestCount()", function() {
				
				it( "should retrieve the total number of '" + actionName + "' requests", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass();
					
					// Initial condition - should have 0 requests. 
					// Example call here: manualProxy.getCreateRequestCount()
					expect( manualProxy[ 'get' + capitalizedActionName + 'RequestCount' ]() ).toBe( 0 );
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					expect( manualProxy[ 'get' + capitalizedActionName + 'RequestCount' ]() ).toBe( 1 );  // ex: manualProxy.getCreateRequestCount()
					manualProxy[ actionName ]( request2 );
					expect( manualProxy[ 'get' + capitalizedActionName + 'RequestCount' ]() ).toBe( 2 );  // ex: manualProxy.getCreateRequestCount()
				} );
				
			} );
			
			
			describe( "notify" + capitalizedActionName + "()", function() {
				
				it( "should notify of progress for the '" + actionName + "' request at `requestNum`", function() {
					var request1 = (new RequestClass()).progress( function() { request1NotifyCount++; } ),  // attach `progress` handler as well as creating the instance
					    request2 = (new RequestClass()).progress( function() { request2NotifyCount++; } ),  // attach `progress` handler as well as creating the instance
					    request1NotifyCount = 0,
					    request2NotifyCount = 0;
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Test initial conditions - not resolved yet
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Notify the first. Example call here: manualProxy.notifyCreate( 0 )
					manualProxy[ 'notify' + capitalizedActionName ]( 0 );
					expect( request1NotifyCount ).toBe( 1 );
					expect( request2NotifyCount ).toBe( 0 );
					
					// Notify the second. Example call here: manualProxy.notifyCreate( 1 )
					manualProxy[ 'notify' + capitalizedActionName ]( 1 );
					expect( request1NotifyCount ).toBe( 1 );
					expect( request2NotifyCount ).toBe( 1 );
					
					// Both requests should still be pending
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
				} );
				
				
				it( "should notify of progress for the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = (new RequestClass()).progress( function() { request1NotifyCount++; } ),  // attach `progress` handler as well as creating the instance
					    request2 = (new RequestClass()).progress( function() { request2NotifyCount++; } ),  // attach `progress` handler as well as creating the instance
					    request1NotifyCount = 0,
					    request2NotifyCount = 0;
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Test initial conditions - not resolved yet
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Notify the second. Example call here: manualProxy.notifyCreate( 1 )
					manualProxy[ 'notify' + capitalizedActionName ]( 1 );
					expect( request1NotifyCount ).toBe( 0 );
					expect( request2NotifyCount ).toBe( 1 );
					
					// Notify the first. Example call here: manualProxy.notifyCreate( 0 )
					manualProxy[ 'notify' + capitalizedActionName ]( 0 );
					expect( request1NotifyCount ).toBe( 1 );
					expect( request2NotifyCount ).toBe( 1 );
					
					// Both requests should still be pending
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
				} );
				
			} );
			
			
			describe( "resolve" + capitalizedActionName + "()", function() {
				
				it( "should resolve the '" + actionName + "' request at `requestNum`", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass();
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Test initial conditions - not resolved yet
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Resolve the first. Example call here: manualProxy.resolveCreate( 0 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 0 );
					expect( request1.state() ).toBe( 'resolved' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Resolve the second. Example call here: manualProxy.resolveCreate( 1 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 1 );
					expect( request1.state() ).toBe( 'resolved' );
					expect( request2.state() ).toBe( 'resolved' );
				} );
				
				
				it( "should resolve the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass();
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Test initial conditions - not resolved yet
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Resolve the first. Example call here: manualProxy.resolveCreate( 1 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 1 );
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'resolved' );
					
					// Resolve the second. Example call here: manualProxy.resolveCreate( 0 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 0 );
					expect( request1.state() ).toBe( 'resolved' );
					expect( request2.state() ).toBe( 'resolved' );
				} );
				
				
				it( "should resolve a '" + actionName + "' request using a directly-provided `resultSet`", function() {
					var resolvedResultSet,
					    request = (new RequestClass()).done( function( resultSet ) { resolvedResultSet = resultSet; } ),
					    resultSet = new ResultSet();
					
					// Add Request to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request );
					
					// Test initial conditions - not resolved yet
					expect( request.state() ).toBe( 'pending' );
					expect( resolvedResultSet ).toBe( undefined );
					
					// Resolve
					manualProxy[ 'resolve' + capitalizedActionName ]( 0, resultSet );
					expect( request.state() ).toBe( 'resolved' );
					expect( resolvedResultSet ).toBe( resultSet );
				} );
				
				
				it( "should resolve a '" + actionName + "' request with some given anonymous data, to be fed through the proxy's `reader`", function() {
					var request = (new RequestClass()).done( function( resultSet ) { resolvedResultSet = resultSet; } ),
					    resolvedResultSet;
					
					// Add Request to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request );
					
					// Test initial conditions - not resolved yet
					expect( request.state() ).toBe( 'pending' );
					expect( resolvedResultSet ).toBe( undefined );
					
					// Resolve with anonymous data, to be fed through the proxy's reader
					manualProxy[ 'resolve' + capitalizedActionName ]( 0, { a: 1, b: 2 } );
					expect( request.state() ).toBe( 'resolved' );
					expect( resolvedResultSet instanceof ResultSet ).toBe( true );
					expect( resolvedResultSet.getRecords()[ 0 ] ).toEqual( { a: 1, b: 2 } );
				} );
				
			} );
			
			
			describe( "reject" + capitalizedActionName + "()", function() {
				
				it( "should reject the '" + actionName + "' request at `requestNum`", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass();
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Test initial conditions - not resolved yet
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Reject the first. Example call here: manualProxy.rejectCreate( 0 )
					manualProxy[ 'reject' + capitalizedActionName ]( 0 );
					expect( request1.state() ).toBe( 'rejected' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Reject the second. Example call here: manualProxy.rejectCreate( 1 )
					manualProxy[ 'reject' + capitalizedActionName ]( 1 );
					expect( request1.state() ).toBe( 'rejected' );
					expect( request2.state() ).toBe( 'rejected' );
				} );
				
				
				it( "should reject the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass();
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 );
					manualProxy[ actionName ]( request2 );
					
					// Test initial conditions - not resolved yet
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'pending' );
					
					// Reject the first. Example call here: manualProxy.rejectCreate( 1 )
					manualProxy[ 'reject' + capitalizedActionName ]( 1 );
					expect( request1.state() ).toBe( 'pending' );
					expect( request2.state() ).toBe( 'rejected' );
					
					// Reject the second. Example call here: manualProxy.rejectCreate( 0 )
					manualProxy[ 'reject' + capitalizedActionName ]( 0 );
					expect( request1.state() ).toBe( 'rejected' );
					expect( request2.state() ).toBe( 'rejected' );
				} );
				
				
				it( "should reject a '" + actionName + "' request with an `error` object", function() {
					var rejectedError,
					    request = (new RequestClass()).fail( function( error ) { rejectedError = error; } );
					
					// Add Request to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request );
					
					// Test initial conditions - not resolved yet
					expect( request.state() ).toBe( 'pending' );
					expect( rejectedError ).toBe( undefined );
					
					// Reject with error
					manualProxy[ 'reject' + capitalizedActionName ]( 0, "Test Error" );
					expect( request.state() ).toBe( 'rejected' );
					expect( rejectedError ).toBe( "Test Error" );
				} );
				
			} );
			
		} );
		
	} );
	
} );