/*global define, describe, beforeEach, afterEach, it, expect, spyOn */
/*jshint sub:true */
define( [
	'jquery',
	'lodash',
	
	'data/persistence/proxy/Proxy',
	'data/persistence/request/Batch',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy'
], function( jQuery, _, Proxy, RequestBatch, CreateRequest, ReadRequest, UpdateRequest, DestroyRequest ) {
	
	describe( 'data.persistence.proxy.Proxy', function() {
		
		// ConcreteProxy with empty implementations for its abstract methods. These will be spied on.
		var ConcreteProxy = Proxy.extend( {
			create  : function() {},
			read    : function() {},
			update  : function() {},
			destroy : function() {}
		} );
		
		
		describe( 'batch()', function() {
			var proxy,
			    createRequest,
			    updateRequest,
			    destroyRequest;
			
			beforeEach( function() {
				proxy = new ConcreteProxy();
				
				createRequest = new CreateRequest();
				updateRequest = new UpdateRequest();
				destroyRequest = new DestroyRequest();
				
				// Spy on the `create()`, `update()`, and `destroy()` methods on the proxy
				_.forEach( [ 'create', 'update', 'destroy' ], function( crudMethod ) {
					spyOn( proxy, crudMethod );
				} );
			} );
			
			
			it( "should call the create(), update(), and destroy() methods with the create/update/destroy requests, respectively", function() {
				var batch = new RequestBatch( {
					requests : [ createRequest, updateRequest, destroyRequest ]
				} );
				
				// Call the `batch()` method
				proxy.batch( batch );
				
				expect( proxy.create.calls.length ).toBe( 1 );
				expect( proxy.create ).toHaveBeenCalledWith( createRequest );
				expect( proxy.update.calls.length ).toBe( 1 );
				expect( proxy.update ).toHaveBeenCalledWith( updateRequest );
				expect( proxy.destroy.calls.length ).toBe( 1 );
				expect( proxy.destroy ).toHaveBeenCalledWith( destroyRequest );
			} );
			
		} );
		
	} );
	
} );
	