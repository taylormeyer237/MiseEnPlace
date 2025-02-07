import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';
import { UploadService } from './upload.service';
import { GetbotsizeService } from '../services/getbotsize.service';
import { NewinvoiceService } from '../services/newinvoice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {

  constructor(
    public router: Router,
    public dialog: MatDialog, 
    public uploadService: UploadService,
    private _getbotsize: GetbotsizeService,
    private _newinvoice: NewinvoiceService,
    ) { }

  public invoiceRaw;
  public invoice;
  public botsize;

  ngOnInit() {

    this.openUploadDialog()
  
    this._getbotsize.getCategories()
      .then(data => {
        this.botsize = data;
        console.log('bottle sizes', data);
      });
  }

  import(){
    // console.log(window.localStorage.getItem('invoice'));
    this.invoiceRaw = JSON.parse(window.localStorage.getItem('invoice'));
    console.log('INVOICE RAW', this.invoiceRaw);

      const prod = {
        invoice: this.invoiceRaw.body.invoice || null,
        distributor: this.invoiceRaw.body.matches[0].name || null,
        dist_id: undefined,
        rep_id: 1, //check
        receiptSet: [],
        total_price: 0,
        url: null,
        admin_id: 1 //default (change with auth)
      }

      this.invoiceRaw.body.products.forEach(product => {
        if (product.guesses.length !== 0) {

          product.guesses.forEach(guess => {
            if (prod.dist_id === undefined) {
              prod.dist_id = guess.product.dist_id || null;
            }

            let indProd = {
              name: guess.name || null,
              price: guess.product.price || null,
              productId: guess.product.productId || null,
              btlSizeId: guess.product.product.btlSizeId || null,
              bottleSize: undefined,
              categoryId: guess.product.product.categoryId || null,
              upc: guess.product.product.upc || null,
              qty: 0
            };

            this.botsize.forEach(bottle => {
                if(indProd.btlSizeId === bottle.id){
                  indProd.bottleSize = bottle.size;
                }
            });

            let count = true;
            for(let i = 0; i < prod.receiptSet.length; i++){
              if(prod.receiptSet[i].name === indProd.name){
                count = false;
              }
            }

            if(count){
              prod.receiptSet.push(indProd);
            }

            count = true;

          });//for each guess
        }//if statement
      });//for each product

      this.invoice = prod;
  }//import

  saveData(){
    console.log('saved!');
    localStorage.removeItem('invoice')

    this._newinvoice.newInvoice(this.invoice)
      .then(data => {
        console.log('newinvoice return', data);
        return this.router.navigate(['invoices'])
      });
  }

  calcTotal(){
    console.log(this.invoice);

    if(this.invoice !== undefined){
      let sum = 0;
      this.invoice.receiptSet.forEach(product => {
        sum += product.qty * product.price;
      });
      this.invoice.total_price = sum;
      return sum;
    }else{
      return 0;
    }
  }
  
  remove(i: string | number){
    console.log('deleted', this.invoice.receiptSet[i]);
    this.invoice.receiptSet.splice(i, 1);
    console.log(this.invoice.receiptSet);
  }

  public openUploadDialog() {
    let dialogRef = this.dialog.open(DialogComponent);  
  }
} 