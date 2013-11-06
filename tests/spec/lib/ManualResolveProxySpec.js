/*global define, describe, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	
	'spec/lib/ManualResolveProxy',
	
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy',
	
	'data/persistence/ResultSet'
], function( _, ManualResolveProxy, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest, ResultSet ) {
	
	describe( 'spec.lib.ManualResolveProxy', function() {
		
		var manualResolveProxy;
		var requestClasses = {
			'create'  : CreateRequest,
			'read'    : ReadRequest,
			'update'  : UpdateRequest,
			'destroy' : DestroyRequest
		};
		
		beforeEach( function() {
			manualResolveProxy = new ManualResolveProxy();
		} );
		
		
		_.forEach( [ 'Create', 'Read', 'Update', 'Destroy' ], function( capitalizedActionName ) {
			var actionName = capitalizedActionName.toLowerCase(),
			    RequestClass = requestClasses[ actionName ];
		
			describe( "resolve" + capitalizedActionName + "()", function() {
				
				it( "should resolve the '" + actionName + "' request at `requestNum`", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    resolvedRequest1,
					    resolvedRequest2;
					
					// Example call here: manualResolveProxy.create( request )
					manualResolveProxy[ actionName ]( request1 ).done( function( request ) { resolvedRequest1 = request; } );
					manualResolveProxy[ actionName ]( request2 ).done( function( request ) { resolvedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( resolvedRequest1 ).toBe( undefined );
					expect( resolvedRequest2 ).toBe( undefined );
					
					// Resolve the first. Example call here: manualResolveProxy.resolveCreate( 0 )
					manualResolveProxy[ 'resolve' + capitalizedActionName ]( 0 );
					expect( resolvedRequest1 ).toBe( request1 );
					expect( resolvedRequest2 ).toBe( undefined );
					
					// Resolve the second. Example call here: manualResolveProxy.resolveCreate( 1 )
					manualResolveProxy[ 'resolve' + capitalizedActionName ]( 1 );
					expect( resolvedRequest1 ).toBe( request1 );
					expect( resolvedRequest2 ).toBe( request2 );
				} );
				
				
				it( "should resolve the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    resolvedRequest1,
					    resolvedRequest2;
					
					// Example call here: manualResolveProxy.create( request )
					manualResolveProxy[ actionName ]( request1 ).done( function( request ) { resolvedRequest1 = request; } );
					manualResolveProxy[ actionName ]( request2 ).done( function( request ) { resolvedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( resolvedRequest1 ).toBe( undefined );
					expect( resolvedRequest2 ).toBe( undefined );
					
					// Resolve the first. Example call here: manualResolveProxy.resolveCreate( 1 )
					manualResolveProxy[ 'resolve' + capitalizedActionName ]( 1 );
					expect( resolvedRequest1 ).toBe( undefined );
					expect( resolvedRequest2 ).toBe( request2 );
					
					// Resolve the second. Example call here: manualResolveProxy.resolveCreate( 0 )
					manualResolveProxy[ 'resolve' + capitalizedActionName ]( 0 );
					expect( resolvedRequest1 ).toBe( request1 );
					expect( resolvedRequest2 ).toBe( request2 );
				} );
				
				
				// The following only apply to 'create', 'read', and 'update' requests - not 'destroy'
				if( actionName === 'create' || actionName === 'read' || actionName === 'update' ) {
					
					it( "should resolve a '" + actionName + "' request using a directly-provided `resultSet`", function() {
						var request = new RequestClass(),
						    resultSet = new ResultSet(),
						    resolvedRequest;
						
						manualResolveProxy[ actionName ]( request ).done( function( request ) { resolvedRequest = request; } );
						
						// Test initial conditions - not resolved yet
						expect( resolvedRequest ).toBe( undefined );
						
						// Resolve
						manualResolveProxy[ 'resolve' + capitalizedActionName ]( 0, resultSet );
						expect( resolvedRequest ).toBe( request );
						expect( resolvedRequest.getResultSet() ).toBe( resultSet );
					} );
					
					
					it( "should resolve a '" + actionName + "' request with some given anonymous data, to be fed through the proxy's `reader`", function() {
						var request = new RequestClass(),
						    resolvedRequest;
						
						manualResolveProxy[ actionName ]( request ).done( function( request ) { resolvedRequest = request; } );
						
						// Test initial conditions - not resolved yet
						expect( resolvedRequest ).toBe( undefined );
						
						// Resolve with anonymous data, to be fed through the proxy's reader
						manualResolveProxy[ 'resolve' + capitalizedActionName ]( 0, { a: 1, b: 2 } );
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
					
					// Example call here: manualResolveProxy.create( request )
					manualResolveProxy[ actionName ]( request1 ).fail( function( request ) { rejectedRequest1 = request; } );
					manualResolveProxy[ actionName ]( request2 ).fail( function( request ) { rejectedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( rejectedRequest1 ).toBe( undefined );
					expect( rejectedRequest2 ).toBe( undefined );
					
					// Reject the first. Example call here: manualResolveProxy.rejectCreate( 0 )
					manualResolveProxy[ 'reject' + capitalizedActionName ]( 0 );
					expect( rejectedRequest1 ).toBe( request1 );
					expect( rejectedRequest2 ).toBe( undefined );
					
					// Reject the second. Example call here: manualResolveProxy.rejectCreate( 1 )
					manualResolveProxy[ 'reject' + capitalizedActionName ]( 1 );
					expect( rejectedRequest1 ).toBe( request1 );
					expect( rejectedRequest2 ).toBe( request2 );
				} );
				
				
				it( "should reject the '" + actionName + "' request at `requestNum`, out of order", function() {
					var request1 = new RequestClass(),
					    request2 = new RequestClass(),
					    rejectedRequest1,
					    rejectedRequest2;
					
					// Example call here: manualResolveProxy.create( request )
					manualResolveProxy[ actionName ]( request1 ).fail( function( request ) { rejectedRequest1 = request; } );
					manualResolveProxy[ actionName ]( request2 ).fail( function( request ) { rejectedRequest2 = request; } );
					
					// Test initial conditions - not resolved yet
					expect( rejectedRequest1 ).toBe( undefined );
					expect( rejectedRequest2 ).toBe( undefined );
					
					// Reject the first. Example call here: manualResolveProxy.rejectCreate( 1 )
					manualResolveProxy[ 'reject' + capitalizedActionName ]( 1 );
					expect( rejectedRequest1 ).toBe( undefined );
					expect( rejectedRequest2 ).toBe( request2 );
					
					// Reject the second. Example call here: manualResolveProxy.rejectCreate( 0 )
					manualResolveProxy[ 'reject' + capitalizedActionName ]( 0 );
					expect( rejectedRequest1 ).toBe( request1 );
					expect( rejectedRequest2 ).toBe( request2 );
				} );
				
			} );
			
		} );
		
	} );
	
} );