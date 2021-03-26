import React, {useState} from 'react';
import {Card,Table} from 'react-bootstrap';
import FileRowDownloads from './FileRowDownloads';
import ShowUploads from './ShowUploads';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoffee } from '@fortawesome/free-solid-svg-icons'

function ShowDownloads(){

    const [downloadedFiles,setDownloadedFiles] = useState([]);

    const onRequestForDownloadedFilesList = () => {
        console.log('fetching file-list from downloads folder');
        window.api.filesApi.fetchFiles('download');
        window.api.filesApi.getFiles().then((fileObj) => {
        setDownloadedFiles( fileObj)
        }).catch((err) => console.log(err));
    };

    const displayFiles = () => {
        if(downloadedFiles){
            const fileTable = downloadedFiles.map(file => <FileRowDownloads fileName={file.name} fileId={file.id} path={""}/>)
            return(
                <div>
                <Card className='Uploaded-files'>
                            <Card.Header>
                                <Card.Title as='h5'>Uploaded Files</Card.Title>
                            </Card.Header>
                            <Card.Body className='px-0 py-2'>
                                <Table responsive hover>
                                    <tbody>
                                    </tbody>
                                    </Table>
                            </Card.Body>
                </Card>
                  <div>{fileTable}</div>
                  </div>
            );
        }
    };
    onRequestForDownloadedFilesList();

      return(
         
            <div >
            {/* <ShowUploads updateDownloads = {this.onRequestForDownloadedFilesList}/>
            <button onClick={this.onRequestForDownloadedFilesList}><FontAwesomeIcon icon={faCoffee} />Show Downloads</button> */}
            {displayFiles()}
            </div>
        
        );
    }


export default ShowDownloads;