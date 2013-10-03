/*global define, window, _, describe, beforeEach, afterEach, it, xit, expect, spyOn */
define( [
	'jquery',
	'data/persistence/operation/Promise',
	'data/persistence/operation/Operation',
	'data/Model'  // Used as the `dataComponent` of the Operations
], function( jQuery, OperationPromise, Operation, Model ) {
	
	describe( 'data.persistence.operation.Promise', function() {
		
		// Concrete Subclass
		var ConcreteOperation = Operation.extend( {} );
		
		// Used as the `dataComponent` of the Operations
		var model = new Model();
		
		
		describe( "Ability to use with jQuery.when()", function() {
			
			it( "should be allowed to be used as a single promise passed to jQuery.when()", function() {
				var operation = new ConcreteOperation( { dataComponent: model } ),
				    operationPromise = new OperationPromise( { operation: operation } ),
				    isDone = false;

				var masterPromise = jQuery.when( operationPromise );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Attach a handler to make extra sure
				masterPromise.done( function() { isDone = true; } );
				
				operation.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
				expect( isDone ).toBe( true );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), only being resolved when all individual promises are resolved", function() {
				var operation1 = new ConcreteOperation( { dataComponent: model } ),
				    operation2 = new ConcreteOperation( { dataComponent: model } ),
				    operation3 = new ConcreteOperation( { dataComponent: model } ),
				    operationPromise1 = new OperationPromise( { operation: operation1 } ),
				    operationPromise2 = new OperationPromise( { operation: operation2 } ),
				    operationPromise3 = new OperationPromise( { operation: operation3 } ),
				    isDone = false;

				var masterPromise = jQuery.when( operationPromise1, operationPromise2, operationPromise3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Attach a handler to make extra sure
				masterPromise.done( function() { isDone = true; } );
				
				// Resolve one at a time
				operation1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );
				expect( isDone ).toBe( false );

				operation2.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );
				expect( isDone ).toBe( false );

				operation3.resolve();
				expect( masterPromise.state() ).toBe( 'resolved' );
				expect( isDone ).toBe( true );
			} );

			
			it( "should be allowed to be used as a multiple promises passed to jQuery.when(), being rejected if just one of the individual promises are rejected", function() {
				var operation1 = new ConcreteOperation( { dataComponent: model } ),
				    operation2 = new ConcreteOperation( { dataComponent: model } ),
				    operation3 = new ConcreteOperation( { dataComponent: model } ),
				    operationPromise1 = new OperationPromise( { operation: operation1 } ),
				    operationPromise2 = new OperationPromise( { operation: operation2 } ),
				    operationPromise3 = new OperationPromise( { operation: operation3 } ),
				    isDone = false;

				var masterPromise = jQuery.when( operationPromise1, operationPromise2, operationPromise3 );
				expect( masterPromise.state() ).toBe( 'pending' );
				
				// Attach a handler to make extra sure
				masterPromise.always( function() { isDone = true; } );
				
				// Resolve the first one
				operation1.resolve();
				expect( masterPromise.state() ).toBe( 'pending' );
				expect( isDone ).toBe( false );

				// Reject the second one
				operation2.reject();
				expect( masterPromise.state() ).toBe( 'rejected' );
				expect( isDone ).toBe( true );

				// Even if this third one is resolved, it should still be "rejected"
				operation3.resolve();
				expect( masterPromise.state() ).toBe( 'rejected' );
				expect( isDone ).toBe( true );
			} );
			
		} );
		
	} );
	
} );
		
