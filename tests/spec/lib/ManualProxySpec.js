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
			
			
			describe( "resolve" + capitalizedActionName + "()", function() {
				
				it( "should resolve the '" + actionName + "' request at `requestNum`", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    resolvedRequest1,
					    resolvedRequest2;
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 ).done( function( request ) { resolvedRequest1 = request; } );
					manualProxy[ actionName ]( request2 ).done( function( request ) { resolvedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( resolvedRequest1 ).toBe( undefined );
					expect( resolvedRequest2 ).toBe( undefined );
					
					// Resolve the first. Example call here: manualProxy.resolveCreate( 0 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 0 );
					expect( resolvedRequest1 ).toBe( request1 );
					expect( resolvedRequest2 ).toBe( undefined );
					
					// Resolve the second. Example call here: manualProxy.resolveCreate( 1 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 1 );
					expect( resolvedRequest1 ).toBe( request1 );
					expect( resolvedRequest2 ).toBe( request2 );
				} );
				
				
				it( "should resolve the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    resolvedRequest1,
					    resolvedRequest2;
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 ).done( function( request ) { resolvedRequest1 = request; } );
					manualProxy[ actionName ]( request2 ).done( function( request ) { resolvedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( resolvedRequest1 ).toBe( undefined );
					expect( resolvedRequest2 ).toBe( undefined );
					
					// Resolve the first. Example call here: manualProxy.resolveCreate( 1 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 1 );
					expect( resolvedRequest1 ).toBe( undefined );
					expect( resolvedRequest2 ).toBe( request2 );
					
					// Resolve the second. Example call here: manualProxy.resolveCreate( 0 )
					manualProxy[ 'resolve' + capitalizedActionName ]( 0 );
					expect( resolvedRequest1 ).toBe( request1 );
					expect( resolvedRequest2 ).toBe( request2 );
				} );
				
				
				// The following only apply to 'create', 'read', and 'update' requests - not 'destroy'
				if( actionName === 'create' || actionName === 'read' || actionName === 'update' ) {
					
					it( "should resolve a '" + actionName + "' request using a directly-provided `resultSet`", function() {
						var request = new RequestClass(),
						    resultSet = new ResultSet(),
						    resolvedRequest;
						
						// Add Request to the proxy. Example call here: manualProxy.create( request )
						manualProxy[ actionName ]( request ).done( function( request ) { resolvedRequest = request; } );
						
						// Test initial conditions - not resolved yet
						expect( resolvedRequest ).toBe( undefined );
						
						// Resolve
						manualProxy[ 'resolve' + capitalizedActionName ]( 0, resultSet );
						expect( resolvedRequest ).toBe( request );
						expect( resolvedRequest.getResultSet() ).toBe( resultSet );
					} );
					
					
					it( "should resolve a '" + actionName + "' request with some given anonymous data, to be fed through the proxy's `reader`", function() {
						var request = new RequestClass(),
						    resolvedRequest;
						
						// Add Request to the proxy. Example call here: manualProxy.create( request )
						manualProxy[ actionName ]( request ).done( function( request ) { resolvedRequest = request; } );
						
						// Test initial conditions - not resolved yet
						expect( resolvedRequest ).toBe( undefined );
						
						// Resolve with anonymous data, to be fed through the proxy's reader
						manualProxy[ 'resolve' + capitalizedActionName ]( 0, { a: 1, b: 2 } );
						expect( resolvedRequest ).toBe( request );
						expect( resolvedRequest.getResultSet() instanceof ResultSet ).toBe( true );
						expect( resolvedRequest.getResultSet().getRecords()[ 0 ] ).toEqual( { a: 1, b: 2 } );
					} );
					
				}
				
			} );
			
			
			describe( "reject" + capitalizedActionName + "()", function() {
				
				it( "should reject the '" + actionName + "' request at `requestNum`", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    rejectedRequest1,
					    rejectedRequest2;
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 ).fail( function( request ) { rejectedRequest1 = request; } );
					manualProxy[ actionName ]( request2 ).fail( function( request ) { rejectedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( rejectedRequest1 ).toBe( undefined );
					expect( rejectedRequest2 ).toBe( undefined );
					
					// Reject the first. Example call here: manualProxy.rejectCreate( 0 )
					manualProxy[ 'reject' + capitalizedActionName ]( 0 );
					expect( rejectedRequest1 ).toBe( request1 );
					expect( rejectedRequest2 ).toBe( undefined );
					
					// Reject the second. Example call here: manualProxy.rejectCreate( 1 )
					manualProxy[ 'reject' + capitalizedActionName ]( 1 );
					expect( rejectedRequest1 ).toBe( request1 );
					expect( rejectedRequest2 ).toBe( request2 );
				} );
				
				
				it( "should reject the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    rejectedRequest1,
					    rejectedRequest2;
					
					// Add Requests to the proxy. Example call here: manualProxy.create( request )
					manualProxy[ actionName ]( request1 ).fail( function( request ) { rejectedRequest1 = request; } );
					manualProxy[ actionName ]( request2 ).fail( function( request ) { rejectedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( rejectedRequest1 ).toBe( undefined );
					expect( rejectedRequest2 ).toBe( undefined );
					
					// Reject the first. Example call here: manualProxy.rejectCreate( 1 )
					manualProxy[ 'reject' + capitalizedActionName ]( 1 );
					expect( rejectedRequest1 ).toBe( undefined );
					expect( rejectedRequest2 ).toBe( request2 );
					
					// Reject the second. Example call here: manualProxy.rejectCreate( 0 )
					manualProxy[ 'reject' + capitalizedActionName ]( 0 );
					expect( rejectedRequest1 ).toBe( request1 );
					expect( rejectedRequest2 ).toBe( request2 );
				} );
				
			} );
			
		} );
		
	} );
	
} );