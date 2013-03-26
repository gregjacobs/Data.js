/*global define, describe, beforeEach, it, expect */
define( [
	'Class',
	'data/persistence/operation/Batch',
	'data/persistence/operation/Operation'
], function( Class, Batch, Operation ) {
	
	var ConcreteOperation = Class.extend( Operation, {
		// no abstract methods
	} );
	
	
	describe( 'data.persistence.operation.Batch', function() {
		var op1, op2, op3;
		
		beforeEach( function() {
			op1 = new ConcreteOperation();
			op2 = new ConcreteOperation();
			op3 = new ConcreteOperation();
		} );
		
		
		describe( 'wasSuccessful()', function() {
			
			it( "should return `true` if all Operations completed successfully", function() {
				op1.setSuccess();
				op2.setSuccess();
				
				var batch = new Batch( {
					operations : [ op1, op2 ]
				} );
				expect( batch.wasSuccessful() ).toBe( true );
			} );
			
			
			it( "should return `false` if just one Operation failed", function() {
				op1.setSuccess();
				op2.setException( "An error occurred" );
				
				var batch = new Batch( {
					operations : [ op1, op2 ]
				} );
				expect( batch.wasSuccessful() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'hasErrored()', function() {
			
			it( "should return `true` if just one Operation failed", function() {
				op1.setSuccess();
				op2.setException( "An error occurred" );
				
				var batch = new Batch( {
					operations : [ op1, op2 ]
				} );
				expect( batch.hasErrored() ).toBe( true );
			} );
			
			
			it( "should return `false` if all Operations completed successfully", function() {
				op1.setSuccess();
				op2.setSuccess();
				
				var batch = new Batch( {
					operations : [ op1, op2 ]
				} );
				expect( batch.hasErrored() ).toBe( false );
			} );
			
		} );
		
		
		describe( 'getSuccessfulOperations()', function() {
			
			it( "should return an array of the Operation objects that have failed (errored)", function() {
				op1.setSuccess();
				op2.setException( "An error occurred" );
				op3.setException( "An error occurred 2" );
				
				var batch = new Batch( {
					operations : [ op1, op2, op3 ]
				} );
				expect( batch.getSuccessfulOperations() ).toEqual( [ op1 ] );
			} );
			
			
			it( "should return an array of all of the Operation objects if they were all successful", function() {
				op1.setSuccess();
				op2.setSuccess();
				op3.setSuccess();
				
				var batch = new Batch( {
					operations : [ op1, op2, op3 ]
				} );
				expect( batch.getSuccessfulOperations() ).toEqual( [ op1, op2, op3 ] );
			} );
			
			
			it( "should return an empty array if all Operation objects failed", function() {
				op1.setException( "An error occurred" );
				op2.setException( "An error occurred 2" );
				
				var batch = new Batch( {
					operations : [ op1, op2 ]
				} );
				expect( batch.getSuccessfulOperations() ).toEqual( [] );
			} );
			
		} );
		
		
		describe( 'getErroredOperations()', function() {
			
			it( "should return an array of the Operation objects that have failed (errored)", function() {
				op1.setSuccess();
				op2.setException( "An error occurred" );
				op3.setException( "An error occurred" );
				
				var batch = new Batch( {
					operations : [ op1, op2, op3 ]
				} );
				expect( batch.getErroredOperations() ).toEqual( [ op2, op3 ] );
			} );
			
			
			it( "should return an array of all of the Operation objects if they all failed (errored)", function() {
				op1.setException( "An error occurred" );
				op2.setException( "An error occurred" );
				op3.setException( "An error occurred" );
				
				var batch = new Batch( {
					operations : [ op1, op2, op3 ]
				} );
				expect( batch.getErroredOperations() ).toEqual( [ op1, op2, op3 ] );
			} );
			
			
			it( "should return an empty array if all Operation objects completed successfully", function() {
				op1.setSuccess();
				op2.setSuccess();
				
				var batch = new Batch( {
					operations : [ op1, op2 ]
				} );
				expect( batch.getErroredOperations() ).toEqual( [] );
			} );
			
		} );
		
	} );
	
} );