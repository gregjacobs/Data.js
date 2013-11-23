/*global define, window, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'jquery',
	
	'data/persistence/operation/Deferred'
], function( jQuery, OperationDeferred ) {
	
	describe( 'data.persistence.operation.OperationDeferred', function() {
		// For tests to use to check all 3 "finalized" states
		var finalizedStates = [
			{ name: 'resolved', method: 'resolve' },
			{ name: 'rejected', method: 'reject' },
			{ name: 'aborted',  method: 'abort' }
		];
		
		var deferred,
		    progressCount, doneCount, failCount, cancelCount, alwaysCount,
		    progressArgs, doneArgs, failArgs, cancelArgs, alwaysArgs;
		
		beforeEach( function() {
			progressCount = doneCount = failCount = cancelCount = alwaysCount = 0;
			progressArgs = doneArgs = failArgs = cancelArgs = alwaysArgs = undefined;
			
			deferred = new OperationDeferred();
			deferred.progress( function() { progressCount++; progressArgs = arguments; } );
			deferred.done( function() { doneCount++; doneArgs = arguments; } );
			deferred.fail( function() { failCount++; failArgs = arguments; } );
			deferred.cancel( function() { cancelCount++; cancelArgs = arguments; } );
			deferred.always( function() { alwaysCount++; alwaysArgs = arguments; } );
			
			// initial condition
			expectDeferredState( 'pending' );  
		} );
		
		
		/**
		 * Function used to check the state of the Deferred, and that the appropriate
		 * handlers were called.
		 * 
		 * Executes 'expect()' statements for the given `state`.
		 * 
		 * @param {String} state The expected state of the Deferred. Must be one of: 'pending', 'resolved', 
		 *   'rejected', or 'aborted'.
		 */
		function expectDeferredState( state ) {
			if( !_.contains( [ 'pending', 'resolved', 'rejected', 'aborted' ], state ) )
				throw new Error( "The `state` provided ('" + state + "') was not a valid OperationDeferred state." );
			
			expect( deferred.state() ).toBe( state );
			expect( doneCount ).toBe( state === 'resolved' ? 1 : 0 );
			expect( failCount ).toBe( state === 'rejected' ? 1 : 0 );
			expect( cancelCount ).toBe( state === 'aborted' ? 1 : 0 );
			expect( alwaysCount ).toBe( state === 'pending' ? 0 : 1 );
		}
		
		
		describe( 'notify()', function() {
			
			it( "should leave the state of the OperationDeferred as 'pending'", function() {
				deferred.progress();
				
				expectDeferredState( 'pending' );
			} );
			
			
			it( "should call `progress` handlers once for each time that notify() is called", function() {
				deferred.notify();
				expect( progressCount ).toBe( 1 );
				
				deferred.notify();
				expect( progressCount ).toBe( 2 );
				
				expectDeferredState( 'pending' );  // double checking that it's still "pending"
			} );
			
			
			// Check that 'progress' handlers aren't called after the Deferred has been "finalized" (i.e. resolved, 
			// rejected, or aborted)
			_.forEach( finalizedStates, function( finalizedState ) {
				
				it( "should not call `progress` handlers after the Deferred has been '" + finalizedState.name + "'", function() {  // "resolved", "rejected", or "aborted"
					deferred[ finalizedState.method ]();  // `deferred.resolve()`, `deferred.reject()`, or `deferred.abort()`
					deferred.notify();                    // attempt to notify, which should be blocked
					
					expect( progressCount ).toBe( 0 );
					expectDeferredState( finalizedState.name );  // "resolved", "rejected", or "aborted"
				} );
				
			} );
			
			
			it( "should call `progress` handlers with the arguments provide to the method", function() { 
				deferred.notify( 1, 2, 3 );
				
				expect( progressArgs ).toEqual( [ 1, 2, 3 ] );
			} );
			
		} );
		
		
		describe( 'resolve()', function() {
			
			it( "should set the state of the OperationDeferred to 'resolved'", function() {
				deferred.resolve();
				
				expectDeferredState( 'resolved' );
			} );
			
			
			it( "should only call `done` handlers once, even if called multiple times", function() {
				deferred.resolve();
				deferred.resolve();
				
				expectDeferredState( 'resolved' );  // this will check that the 'done' count is only 1
			} );
			
			
			it( "should prevent the OperationDeferred from becoming 'rejected' after it has been 'resolved'", function() {
				deferred.resolve();
				deferred.reject();  // attempt to reject, which should have been blocked
				
				expectDeferredState( 'resolved' );
			} );
			
			
			it( "should prevent the OperationDeferred from becoming 'aborted' after it has been 'resolved'", function() {
				deferred.resolve();
				deferred.abort();  // attempt to abort, which should have been blocked
				
				expectDeferredState( 'resolved' );
			} );
			
			
			it( "should call `done` handlers with the arguments provide to the method", function() {
				deferred.resolve( 1, 2, 3 );
				
				expect( doneArgs ).toEqual( [ 1, 2, 3 ] );
			} );
			
		} );
		
		
		describe( 'reject()', function() {
			
			it( "should set the state of the OperationDeferred to 'rejected'", function() {
				deferred.reject();
				
				expectDeferredState( 'rejected' );
			} );
			
			
			it( "should only call `fail` handlers once, even if called multiple times", function() {
				deferred.reject();
				deferred.reject();
				
				expectDeferredState( 'rejected' );  // this will check that the 'fail' count is only 1
			} );
			
			
			it( "should prevent the OperationDeferred from becoming 'resolved' after it has been 'rejected'", function() {
				deferred.reject();
				deferred.resolve();  // attempt to resolve, which should have been blocked
				
				expectDeferredState( 'rejected' );
			} );
			
			
			it( "should prevent the OperationDeferred from becoming 'aborted' after it has been 'rejected'", function() {
				deferred.reject();
				deferred.abort();  // attempt to abort, which should have been blocked
				
				expectDeferredState( 'rejected' );
			} );
			
			
			it( "should call `fail` handlers with the arguments provide to the method", function() {
				deferred.reject( 1, 2, 3 );
				
				expect( failArgs ).toEqual( [ 1, 2, 3 ] );
			} );
			
		} );
		
		
		describe( 'abort()', function() {
			
			it( "should set the state of the OperationDeferred to 'aborted'", function() {
				deferred.abort();
				
				expectDeferredState( 'aborted' );
			} );
			
			
			it( "should only call `cancel` handlers once, even if called multiple times", function() {
				deferred.abort();
				deferred.abort();
				
				expectDeferredState( 'aborted' );  // this will check that the 'cancel' count is only 1
			} );
			
			
			it( "should prevent the OperationDeferred from becoming 'successful' after it has been 'aborted'", function() {
				deferred.abort();
				deferred.resolve();  // attempt to resolve, which should have been blocked
				
				expectDeferredState( 'aborted' );
			} );
			
			
			it( "should prevent the OperationDeferred from becoming 'failed' after it has been 'aborted'", function() {
				deferred.abort();
				deferred.reject();  // attempt to reject, which should have been blocked
				
				expectDeferredState( 'aborted' );
			} );
			
			
			it( "should call `cancel` handlers with the arguments provide to the method", function() {
				deferred.abort( 1, 2, 3 );
				
				expect( cancelArgs ).toEqual( [ 1, 2, 3 ] );
			} );
			
		} );
		
		
		// -----------------------------------
		
		// Promise Interface
		
		describe( 'promise()', function() {
			
			it( "should simply return the OperationDeferred itself (which is a 'deferred', but will act as the promise as well). This method is for jQuery promise compatibility when using jQuery.when()", function() {				
				var promise = deferred.promise();
				
				expect( promise ).toBe( deferred );
			} );
			
		} );
		
		
		describe( 'done()', function() {
			var localDoneCallCount;
			
			beforeEach( function() {
				localDoneCallCount = 0;
			} );
			
			it( "should register a handler to be called when the OperationDeferred has been 'resolved'", function() {
				deferred.done( function() { localDoneCallCount++; } );
				deferred.resolve();
				
				expectDeferredState( 'resolved' );
				expect( localDoneCallCount ).toBe( 1 );
			} );
			
			
			it( "should immediately call any new handlers attached after the OperationDeferred has been 'resolved'", function() {
				deferred.resolve();
				deferred.done( function() { localDoneCallCount++; } );  // should be called immediately
				
				expectDeferredState( 'resolved' );
				expect( localDoneCallCount ).toBe( 1 );
			} );
			
		} );
		
		
		describe( 'fail()', function() {
			var localFailCallCount;
			
			beforeEach( function() {
				localFailCallCount = 0;
			} );
			
			it( "should register a handler to be called when the OperationDeferred has been 'rejected'", function() {
				deferred.fail( function() { localFailCallCount++; } );
				deferred.reject();
				
				expectDeferredState( 'rejected' );
				expect( localFailCallCount ).toBe( 1 );
			} );
			
			
			it( "should immediately call any new handlers attached after the OperationDeferred has been 'rejected'", function() {
				deferred.reject();
				deferred.fail( function() { localFailCallCount++; } );  // should be called immediately
				
				expectDeferredState( 'rejected' );
				expect( localFailCallCount ).toBe( 1 );
			} );
			
		} );
		
		
		describe( 'abort()', function() {
			var localAbortCallCount;
			
			beforeEach( function() {
				localAbortCallCount = 0;
			} );
			
			it( "should register a handler to be called when the OperationDeferred has been 'aborted'", function() {
				deferred.cancel( function() { localAbortCallCount++; } );
				deferred.abort();
				
				expectDeferredState( 'aborted' );
				expect( localAbortCallCount ).toBe( 1 );
			} );
			
			
			it( "should immediately call any new handlers attached after the OperationDeferred has been 'aborted'", function() {
				deferred.abort();
				deferred.cancel( function() { localAbortCallCount++; } );  // should be called immediately
				
				expectDeferredState( 'aborted' );
				expect( localAbortCallCount ).toBe( 1 );
			} );
			
		} );
		
		
		describe( 'then()', function() {
			var localDoneCount,
			    localFailCount,
			    localProgressCount;
			
			beforeEach( function() {
				localDoneCount = localFailCount = localProgressCount = 0;
				
				deferred.then(
					function() { localDoneCount++; },
					function() { localFailCount++; },
					function() { localProgressCount++; }
				);
			} );
			
			
			it( "should register a `done` handler", function() {
				expect( localDoneCount ).toBe( 0 );  // initial condition
				
				deferred.resolve();
				expect( localDoneCount ).toBe( 1 );
			} );
			
			
			it( "should register a `fail` handler", function() {
				expect( localFailCount ).toBe( 0 );  // initial condition
				
				deferred.reject();
				expect( localFailCount ).toBe( 1 );
			} );
			
			
			it( "should register a `progress` handler", function() {
				expect( localProgressCount ).toBe( 0 );  // initial condition
				
				deferred.notify();
				expect( localProgressCount ).toBe( 1 );
			} );
			
		} );
		
		
		describe( 'always()', function() {
			var localAlwaysCallCount;
			
			beforeEach( function() {
				localAlwaysCallCount = 0;
			} );
			
			
			// Create tests for all 3 "finalized" states: 'resolved', 'rejected', and 'aborted'
			_.forEach( finalizedStates, function( finalizedState ) {
				
				it( "should register a handler to be called when the OperationDeferred has been '" + finalizedState.name + "'", function() {
					deferred.always( function() { localAlwaysCallCount++; } );
					deferred[ finalizedState.method ]();  // `deferred.resolve()`, `deferred.reject()`, or `deferred.abort()`
					
					expectDeferredState( finalizedState.name );  // "resolved", "rejected", or "aborted"
					expect( localAlwaysCallCount ).toBe( 1 );
				} );
			
				
				it( "should immediately call any new handlers attached after the OperationDeferred has been '" + finalizedState.name + "'", function() {
					deferred[ finalizedState.method ]();  // `deferred.resolve()`, `deferred.reject()`, or `deferred.abort()`
					deferred.always( function() { localAlwaysCallCount++; } );  // should be called immediately
					
					expectDeferredState( finalizedState.name );  // "resolved", "rejected", or "aborted"
					expect( localAlwaysCallCount ).toBe( 1 );
				} );
				
			} );
			
		} );
		
		
		describe( "compatibility with jQuery.when()", function() {
			
			it( "should be allowed to be used as a single promise passed to jQuery.when()", function() {
				var deferred = new OperationDeferred(),
				    isDone = false;

				var masterPromise = jQuery.when( deferred );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Attach a handler to make sure
				masterPromise.done( function() { isDone = true; } );
				
				deferred.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
				expect( isDone ).toBe( true );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), only being resolved when all individual promises are resolved", function() {
				var deferred1 = new OperationDeferred(),
				    deferred2 = new OperationDeferred(),
				    deferred3 = new OperationDeferred();

				var masterPromise = jQuery.when( deferred1, deferred2, deferred3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Resolve one at a time
				deferred1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				deferred2.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				deferred3.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), being rejected if just one of the individual promises are rejected", function() {
				var deferred1 = new OperationDeferred(),
				    deferred2 = new OperationDeferred(),
				    deferred3 = new OperationDeferred();

				var masterPromise = jQuery.when( deferred1, deferred2, deferred3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Resolve the first one
				deferred1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );

				// Reject the second one
				deferred2.reject();
				expect( masterPromise.state() ).toBe( 'rejected' );

				// Even if this third one is resolved, it should still be "rejected"
				deferred3.resolve();
				expect( masterPromise.state() ).toBe( 'rejected' );
			} );
			
		} );
		
	} );
	
} );