/*global define, describe, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	'Class'
], function( _, Class ) {
	
	/**
	 * @class spec.lib.DeferredTestCreator
	 * 
	 * This class is used to test the classes of Data.js which implement a Deferred interface, in order to
	 * not repeat the same tests in each spec file, this class is used to build the tests that check the basic
	 * functionality of the Deferred methods.
	 */
	var DeferredTestCreator = Class.create( {
		abstractClass : true,
		
		/**
		 * Creates the tests for the particular "Deferred" class being tested. 
		 * 
		 * Creates the `beforeEach`, all of the tests which will be executed, and the `afterEach` (if any).
		 * 
		 * This is the public method which should be called from the Spec file.
		 */
		createTests : function() {
			beforeEach( _.bind( this.beforeEach, this ) );
			
			this.buildTests();
			
			afterEach( _.bind( this.afterEach, this ) );
		},
		
		
		/**
		 * Implementation of the Jasmine `beforeEach` block. Subclasses may override and extend this implementation.
		 * 
		 * @protected
		 */
		beforeEach : function() {
			this.instance = this.createDeferredInstance();
		},
		
		
		/**
		 * Implementation of the Jasmine `afterEach` block. Currently, there is an empty function, but subclasses 
		 * may override and extend this method to add their own subclass-specific implementation.
		 * 
		 * @protected
		 */
		afterEach : function() {},
		
		
		/**
		 * Abstract method which must be implemented by subclasses to create the Deferred instance (an instance
		 * of the class which implements the Deferred interface).
		 * 
		 * @abstract
		 * @protected
		 * @return {jQuery.Deferred} An instance that implements the jQuery Deferred interface.
		 */
		createDeferredInstance : Class.abstractMethod,
		
		
		/**
		 * Protected method which does the actual building of the tests. This method should be extended in subclasses to
		 * create any additional tests for a specific "load" method.
		 * 
		 * This method should basically just call the Jasmine `it()` function, to create tests.
		 * 
		 * @protected
		 */
		buildTests: function() {
			var me = this;
			
			describe( 'promise()', function() {
				it( "should simply return the Deferred instance itself (which will act as the promise as well). This method is for jQuery promise compatibility when using jQuery.when()", _.bind( me.test_promise_shouldReturnDeferredInstance, me ) );
			} );
			
			describe( 'status()', function() {
				it( "should return 'pending' when the Operation has not yet been started, or is in progress", _.bind( me.test_status_shouldReturnPendingWhenNotYetStartedOrInProgress, me ) );				
				it( "should return 'resolved' when the Operation has been resolved (i.e. it has completed successfully)", _.bind( me.test_status_shouldReturnTheStringResolvedWhenResolved, me ) );				
				it( "should return 'rejected' when the Operation has been rejected (i.e. it has errored)", _.bind( me.test_status_shouldReturnTheStringRejectedWhenRejected, me ) );
				//it( "should return 'aborted' when the Operation has been aborted by the user", _.bind( me.test_status_shouldReturnTheStringAbortedWhenTheOperation, me ) );
			} );
		},
		
		
		// ----------------------------------------
		
		
		test_promise_shouldReturnDeferredInstance : function() {
			var promise = this.instance.promise();
			
			expect( promise ).toBe( this.instance );
		}
		
		/*describe( 'status()', function() {
			var operation,
			    request;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model, proxy: proxy, requests: request } );
			} );
			
			
			it( "should return 'pending' when the Operation has not yet been started, or is in progress", function() {				
				expect( operation.state() ).toBe( 'pending' );
				
				operation.executeRequests();
				expect( operation.state() ).toBe( 'pending' );
			} );
			
			
			it( "should return 'resolved' when the Operation has been resolved (i.e. it has completed successfully)", function() {				
				expect( operation.state() ).toBe( 'pending' );  // initial condition
				
				operation.resolve();
				expect( operation.state() ).toBe( 'resolved' );
			} );
			
			
			it( "should return 'rejected' when the Operation has been rejected (i.e. it has errored)", function() {				
				expect( operation.state() ).toBe( 'pending' );  // initial condition
				
				operation.reject();
				expect( operation.state() ).toBe( 'rejected' );
			} );
			
			
			it( "should return 'aborted' when the Operation has been aborted by the user", function() {				
				expect( operation.state() ).toBe( 'pending' );  // initial condition
				
				operation.abort();
				expect( operation.state() ).toBe( 'aborted' );
			} );
			
		} );*/
		
	} );
	
	return DeferredTestCreator;
	
} );