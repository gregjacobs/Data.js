/*global define, describe, beforeEach, it, expect */
define( [
	'jquery',
	
	'data/persistence/request/Request',
	'data/persistence/ResultSet'
], function( jQuery, Request, ResultSet ) {
	
	
	describe( 'data.persistence.request.Request', function() {
		
		var ConcreteRequest = Request.extend( {
			// Implementation of abstract interface
			getAction : function() {}
		} );
		
		var request;  // a ConcreteRequest for tests to use
		beforeEach( function() {
			request = new ConcreteRequest();
		} );
		
		
		describe( 'getUuid()', function() {
			
			it( "should return a new unique ID for each Request object that is instantiated", function() {
				var request1 = new ConcreteRequest(),
				    request2 = new ConcreteRequest();
				
				expect( typeof request1.getUuid() ).toBe( 'string' );
				expect( typeof request2.getUuid() ).toBe( 'string' );
				expect( request1.getUuid().length ).toBeGreaterThan( 0 );
				expect( request2.getUuid().length ).toBeGreaterThan( 0 );
				
				expect( request1.getUuid() ).not.toBe( request2.getUuid() );
			} );
			
			
			it( "should return the same unique ID for each call to the method", function() {
				expect( request.getUuid() ).toBe( request.getUuid() );
			} );
			
		} );
		
		
		describe( 'getResultSet()', function() {
			
			it( "should return `undefined` when the Request has not yet been resolved", function() {
				expect( request.getResultSet() ).toBeUndefined();
			} );
			
			
			it ("should return `undefined` when the Request has been resolved with no ResultSet object", function() {
				request.resolve();
				
				expect( request.getResultSet() ).toBeUndefined();
			} );
			
			
			it( "should return the ResultSet object which the Request was resolved with", function() {
				var resultSet = new ResultSet();
				request.resolve( resultSet );
				
				expect( request.getResultSet() ).toBe( resultSet );
			} );
			
		} );
		
		
		describe( 'getError()', function() {
			
			it( "should return `undefined` when the Request has not yet been completed", function() {
				expect( request.isComplete() ).toBe( false );  // just checking 
				
				expect( request.getError() ).toBeUndefined();
			} );
			
			
			it( "should return `undefined` when the Request has been completed successfully", function() {
				request.resolve();
				
				expect( request.getError() ).toBeUndefined();
			} );
			
			
			it( "should return `undefined` when the Request has errored, but not 'error' object/string has been set", function() {
				request.reject();  // note: no 'error' argument provided to reject()
				
				expect( request.getError() ).toBeUndefined();
			} );
			
			
			it( "should return the 'error' object/string that has been passed to reject()", function() {
				request.reject( "Error Message" );
				
				expect( request.getError() ).toBe( "Error Message" );
			} );
			
		} );
		
		
		describe( 'wasSuccessful()', function() {
			
			it( "should return `false` when the Request has not yet been completed", function() {
				expect( request.isComplete() ).toBe( false );  // just checking 
				
				expect( request.wasSuccessful() ).toBe( false );
			} );
			
			
			it( "should return `true` when the Request has been completed successfully", function() {
				request.resolve(); 
				
				expect( request.wasSuccessful() ).toBe( true );
			} );
			
			
			it( "should return `false` when the Request has errored without an 'error' object provided", function() {
				request.reject();
				
				expect( request.wasSuccessful() ).toBe( false );
			} );
			
			
			it( "should return `false` when the Request has errored with an 'error' object provided", function() {
				request.reject( "Error Message" );
				
				expect( request.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'hasErrored()', function() {
			
			it( "should return `true` when the Request has not yet been completed", function() {
				expect( request.isComplete() ).toBe( false );  // just double checking 
				
				expect( request.hasErrored() ).toBe( false );
			} );
			
			
			it( "should return `false` when the Request has been completed successfully", function() {
				request.resolve(); 
				
				expect( request.hasErrored() ).toBe( false );
			} );
			
			
			it( "should return `true` when the Request has errored without an 'error' object provided", function() {
				request.reject();
				
				expect( request.hasErrored() ).toBe( true );
			} );
			
			
			it( "should return `true` when the Request has errored with an 'error' object provided", function() {
				request.reject( "Error Message" );
				
				expect( request.hasErrored() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'isComplete()', function() {
			
			it( "should return `false` if the Request has not yet been marked as successful or errored", function() {
				expect( request.isComplete() ).toBe( false );
			} );
			
			
			it( "should return `true` if the Request has been resolved (marked as successful)", function() {
				request.resolve();
				expect( request.isComplete() ).toBe( true );
			} );
			
			
			it( "should return `true` if the Request has been rejected (marked as errored)", function() {
				request.reject();
				expect( request.isComplete() ).toBe( true );
			} );
			
		} );
		
		
		// -----------------------------------
		
		// Request's Promise Interface
		
		
		describe( 'promise()', function() {
			
			it( "should simply return the Request itself (which is a 'deferred', but will act as the promise as well). This method is for jQuery promise compatibility when using jQuery.when()", function() {				
				var promise = request.promise();
				
				expect( promise ).toBe( request );
			} );
			
		} );
		
		
		describe( 'status()', function() {
			
			it( "should return 'pending' when the Request has not yet been started, or is in progress", function() {				
				expect( request.state() ).toBe( 'pending' );
			} );
			
			
			it( "should return 'resolved' when the Request has been resolved (i.e. it has completed successfully)", function() {				
				expect( request.state() ).toBe( 'pending' );  // initial condition
				
				request.resolve();
				expect( request.state() ).toBe( 'resolved' );
			} );
			
			
			it( "should return 'rejected' when the Request has been rejected (i.e. it has errored)", function() {				
				expect( request.state() ).toBe( 'pending' );  // initial condition
				
				request.reject();
				expect( request.state() ).toBe( 'rejected' );
			} );
			
		} );
		
		
		describe( 'progress()', function() {
			var progressCallCount;
			
			beforeEach( function() {
				progressCallCount = 0;
				request.progress( function() { progressCallCount++; } );
			} );
			
			
			it( "should register a handler to be called when the notify() method is called", function() {
				expect( progressCallCount ).toBe( 0 );  // initial condition
				
				request.notify();
				expect( progressCallCount ).toBe( 1 );
				
				request.notify();
				expect( progressCallCount ).toBe( 2 );
			} );
			
			
			it( "should register a handler that is called only while the Request is in-progress", function() {
				expect( progressCallCount ).toBe( 0 );  // initial condition
				
				request.notify();
				expect( progressCallCount ).toBe( 1 );
				
				request.resolve();
				request.notify();
				expect( progressCallCount ).toBe( 1 );  // should still be 1, since the 2nd notify() came after Request resolution
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( request.progress() ).toBe( request );
			} );
			
		} );
		
		
		describe( 'done()', function() {
			
			it( "should register a handler to be called upon Request success", function() {
				var doneCallCount = 0;
				
				request.done( function() { 
					doneCallCount++;
				} );
				
				request.resolve();
				expect( doneCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( request.done() ).toBe( request );
			} );
			
		} );
		
		
		describe( 'fail()', function() {
			
			it( "should register a handler to be called upon Request error", function() {
				var errorCallCount = 0;
				
				request.fail( function() { 
					errorCallCount++;
				} );
				
				request.reject();
				expect( errorCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( request.fail() ).toBe( request );
			} );
			
		} );
		
		
		describe( 'then()', function() {
			var localDoneCount,
			    localFailCount,
			    localProgressCount;
			
			beforeEach( function() {
				localDoneCount = localFailCount = localProgressCount = 0;
				
				request.then(
					function() { localDoneCount++; },
					function() { localFailCount++; },
					function() { localProgressCount++; }
				);
			} );
			
			
			it( "should register a `done` handler", function() {
				expect( localDoneCount ).toBe( 0 );  // initial condition
				
				request.resolve();
				expect( localDoneCount ).toBe( 1 );
			} );
			
			
			it( "should register a `fail` handler", function() {
				expect( localFailCount ).toBe( 0 );  // initial condition
				
				request.reject();
				expect( localFailCount ).toBe( 1 );
			} );
			
			
			it( "should register a `progress` handler", function() {
				expect( localProgressCount ).toBe( 0 );  // initial condition
				
				request.notify();
				expect( localProgressCount ).toBe( 1 );
				
				request.notify();
				expect( localProgressCount ).toBe( 2 );
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( request.then() ).toBe( request );
			} );
			
		} );
		
		
		describe( 'always()', function() {
			var alwaysCallCount;
			
			beforeEach( function() {
				alwaysCallCount = 0;
				request.always( function() { alwaysCallCount++; } );
			} );
			
			
			it( "should register a handler to be called upon Request success", function() {
				request.resolve();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Request error", function() {
				request.reject();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should return `this`, making it chainable", function() {
				expect( request.always() ).toBe( request );
			} );
			
		} );
		
		
		describe( "compatibility with jQuery.when()", function() {
			
			it( "should be allowed to be used as a single promise passed to jQuery.when()", function() {
				var isDone = false;

				var masterPromise = jQuery.when( request );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Attach a handler to make sure
				masterPromise.done( function() { isDone = true; } );
				
				request.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
				expect( isDone ).toBe( true );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), only being resolved when all individual promises are resolved", function() {
				var request1 = new ConcreteRequest(),
				    request2 = new ConcreteRequest(),
				    request3 = new ConcreteRequest();

				var masterPromise = jQuery.when( request1, request2, request3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Resolve one at a time
				request1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				request2.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				request3.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), being rejected if just one of the individual promises are rejected", function() {
				var request1 = new ConcreteRequest(),
				    request2 = new ConcreteRequest(),
				    request3 = new ConcreteRequest();

				var masterPromise = jQuery.when( request1, request2, request3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Resolve the first one
				request1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				// Reject the second one
				request2.reject();
				expect( masterPromise.state() ).toBe( 'rejected' );

				// Even if this third one is resolved, it should still be "rejected"
				request3.resolve();
				expect( masterPromise.state() ).toBe( 'rejected' );
			} );
			
		} );
		
	} );
	
} );