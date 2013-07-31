/*global define, window, _, describe, beforeEach, afterEach, it, xit, expect, spyOn */
define( [
	'data/persistence/operation/Operation',
	'data/persistence/operation/Promise',
	'data/Model'  // Used as the `dataComponent` of the Operations
], function( Operation, OperationPromise, Model ) {
	
	describe( 'data.persistence.operation.Operation', function() {
		
		// Concrete Subclass
		var ConcreteOperation = Operation.extend( {} );
		
		// Used as the `dataComponent` of the Operations
		var model = new Model();
		
		
		
		
		// -----------------------------------
		
		// Requests' interface
		
		// TODO
		
		
		// -----------------------------------
		
		// Operation's state interface
		
		
		describe( 'resolve()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been resolved", function() {
				operation.resolve();
				operation.reject();  // attempt to reject, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( true );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasCanceled() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'canceled' after it has been resolved", function() {
				operation.resolve();
				operation.abort();  // attempt to abort, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( true );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasCanceled() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'wasSuccessful()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.wasSuccessful() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.wasSuccessful() ).toBe( true );
			} );
			
			it( "should return `false` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.wasSuccessful() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'reject()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should prevent the Operation from becoming 'successful' after it has been rejected", function() {
				operation.reject();
				operation.resolve();  // attempt to resolve, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( true );
				expect( operation.wasCanceled() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'canceled' after it has been rejected", function() {
				operation.reject();
				operation.abort();  // attempt to abort, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( true );
				expect( operation.wasCanceled() ).toBe( false );
				expect( operation.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'hasErrored()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.hasErrored() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.hasErrored() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.hasErrored() ).toBe( true );
			} );
			
			it( "should return `false` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.hasErrored() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'abort()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should prevent the Operation from becoming 'successful' after it has been aborted", function() {
				operation.abort();
				operation.resolve();  // attempt to resolve, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasCanceled() ).toBe( true );
				expect( operation.isComplete() ).toBe( true );
			} );
			
			
			it( "should prevent the Operation from becoming 'failed' after it has been aborted", function() {
				operation.abort();
				operation.reject();  // attempt to reject, which should have been blocked
				
				expect( operation.wasSuccessful() ).toBe( false );
				expect( operation.hasErrored() ).toBe( false );
				expect( operation.wasCanceled() ).toBe( true );
				expect( operation.isComplete() ).toBe( true );
			} );
		} );
		
		
		describe( 'wasCanceled()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.wasCanceled() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.wasCanceled() ).toBe( false );
			} );
			
			it( "should return `false` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.wasCanceled() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.wasCanceled() ).toBe( true );
			} );
			
		} );
		
		
		describe( 'isComplete()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should return `false` for a brand new Operation", function() {
				expect( operation.isComplete() ).toBe( false );
			} );
			
			it( "should return `true` after the Operation has been resolved", function() {
				operation.resolve();
				expect( operation.isComplete() ).toBe( true );
			} );
			
			it( "should return `true` after the Operation has been rejected", function() {
				operation.reject();
				expect( operation.isComplete() ).toBe( true );
			} );
			
			it( "should return `true` after the Operation has been aborted", function() {
				operation.abort();
				expect( operation.isComplete() ).toBe( true );
			} );
			
		} );
		
		
		// -----------------------------------
		
		// Promise Interface
		
		describe( 'promise()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should return an OperationPromise instance that is a view of the Operation", function() {				
				var promise = operation.promise();
				
				expect( promise instanceof OperationPromise ).toBe( true );
			} );
			
			it( "should return the same OperationPromise instance for multiple calls (testing lazy instantiation)", function() {				
				var promise1 = operation.promise(),
				    promise2 = operation.promise();
				
				expect( promise1 ).toBe( promise2 );
			} );
			
		} );
		
		
		describe( 'done()', function() {
			
			it( "should register a handler to be called upon Operation success", function() {
				var operation = new ConcreteOperation( { dataComponent: model } ),
				    doneCallCount = 0;
				
				operation.done( function( dataComponent, op ) { 
					doneCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.resolve();
				expect( doneCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
		
		describe( 'fail()', function() {
			
			it( "should register a handler to be called upon Operation error", function() {
				var operation = new ConcreteOperation( { dataComponent: model } ),
				    errorCallCount = 0;
				
				operation.fail( function( dataComponent, op ) { 
					errorCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.reject();
				expect( errorCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
		
		describe( 'cancel()', function() {
			
			it( "should register a handler to be called if the Operation is canceled (aborted)", function() {
				var operation = new ConcreteOperation( { dataComponent: model } ),
				    cancelCallCount = 0;
				
				operation.cancel( function( dataComponent, op ) { 
					cancelCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.abort();
				expect( cancelCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
		
		describe( 'always()', function() {
			var operation;
			
			beforeEach( function() {
				operation = new ConcreteOperation( { dataComponent: model } );
			} );
			
			
			it( "should register a handler to be called upon Operation success", function() {
				var alwaysCallCount = 0;
				
				operation.always( function( dataComponent, op ) { 
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.resolve();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Operation error", function() {
				var alwaysCallCount = 0;
				
				operation.always( function( dataComponent, op ) {
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.reject();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
			
			it( "should register a handler to be called upon Operation cancellation", function() {
				var alwaysCallCount = 0;
				
				operation.always( function( dataComponent, op ) {
					alwaysCallCount++;
					
					expect( dataComponent ).toBe( model );
					expect( op ).toBe( operation );
				} );
				
				operation.abort();
				expect( alwaysCallCount ).toBe( 1 );  // confirm that the handler was called at all
			} );
			
		} );
		
	} );
	
} );